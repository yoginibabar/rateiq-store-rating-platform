import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import {
  Prisma,
  Role,
  UserStatus,
  NotificationType,
} from '@prisma/client';

import { env } from './config/env';
import { prisma } from './lib/prisma';
import {
  auth,
  roles,
  AuthRequest,
} from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import {
  analytics,
  anomaly,
  insight,
} from './utils/intelligence';

const app = express();

/* =========================================================
   APP CONFIGURATION
========================================================= */

app.disable('x-powered-by');

app.use(helmet());

app.use(
  cors({
    origin: env.CLIENT_URL,
  }),
);

app.use(
  express.json({
    limit: '1mb',
  }),
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

/* =========================================================
   HELPERS
========================================================= */

const cleanUser = (user: any) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  address: user.address,
  role: user.role,
  status: user.status,
  createdAt: user.createdAt,
});

const sign = (user: any) =>
  jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    env.JWT_SECRET,
    {
      expiresIn: '7d',
    },
  );

async function audit(
  actorId: number | undefined,
  action: string,
  entityType: string,
  entityId?: number,
  metadata?: any,
) {
  await prisma.auditLog
    .create({
      data: {
        actorId,
        action,
        entityType,
        entityId,
        metadata,
      },
    })
    .catch(() => {});
}

async function notify(
  userId: number,
  type: NotificationType,
  title: string,
  message: string,
) {
  await prisma.notification
    .create({
      data: {
        userId,
        type,
        title,
        message,
      },
    })
    .catch(() => {});
}

const storeWhere = (
  q: unknown,
): Prisma.StoreWhereInput => {
  const search = String(q ?? '').trim();

  if (!search) {
    return {};
  }

  return {
    OR: [
      {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        address: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        email: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ],
  };
};


const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(16, 'Password must be at most 16 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const userCreateSchema = z.object({
  name: z.string().trim().min(20, 'Name must be at least 20 characters').max(60, 'Name must be at most 60 characters'),
  email: z.string().trim().email('Enter a valid email address'),
  address: z.string().trim().min(1, 'Address is required').max(400, 'Address must be at most 400 characters'),
  password: passwordSchema,
  role: z.enum(['ADMIN', 'USER', 'OWNER']).default('USER'),
});

const userUpdateSchema = z.object({
  name: z.string().trim().min(20, 'Name must be at least 20 characters').max(60, 'Name must be at most 60 characters').optional(),
  email: z.string().trim().email('Enter a valid email address').optional(),
  address: z.string().trim().max(400, 'Address must be at most 400 characters').optional(),
  role: z.enum(['ADMIN', 'USER', 'OWNER']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  password: passwordSchema.optional(),
});

const storeCreateSchema = z.object({
  name: z.string().trim().min(1, 'Store name is required'),
  email: z.string().trim().email('Enter a valid email address'),
  address: z.string().trim().min(1, 'Address is required').max(400, 'Address must be at most 400 characters'),
  ownerId: z.number().int().positive().nullable().optional(),
});

const storeUpdateSchema = z.object({
  name: z.string().trim().min(1, 'Store name is required').optional(),
  email: z.string().trim().email('Enter a valid email address').optional(),
  address: z.string().trim().max(400, 'Address must be at most 400 characters').optional(),
  ownerId: z.number().int().positive().nullable().optional(),
});


function storeWhereUser(q: any) {
  const search = String(q || '').trim();

  if (!search) {
    return {};
  }

  return {
    OR: [
      {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        email: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        address: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ],
  };
}

/* =========================================================
   HEALTH
========================================================= */

app.get('/api/health', async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      service: 'RateIQ API',
      status: 'healthy',
    });
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   AUTH - REGISTER
========================================================= */

app.post(
  '/api/auth/register',
  async (req, res, next) => {
    try {
      const {
        name,
        email,
        address,
        password,
        confirmPassword,
      } = req.body || {};

      if (
        !name ||
        !email ||
        !address ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Name, email, address and password are required',
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Passwords do not match',
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message:
            'Password must be at least 8 characters',
        });
      }

      const normalizedEmail =
        String(email).toLowerCase();

      const exists =
        await prisma.user.findUnique({
          where: {
            email: normalizedEmail,
          },
        });

      if (exists) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered',
        });
      }

      const user =
        await prisma.user.create({
          data: {
            name: String(name).trim(),
            email: normalizedEmail,
            address: String(address).trim(),
            passwordHash:
              await bcrypt.hash(password, 12),
            role: Role.USER,
            status: UserStatus.ACTIVE,
          },
        });

      const token = sign(user);

      res.status(201).json({
        success: true,
        user: cleanUser(user),
        token,
      });
    } catch (error) {
      next(error);
    }
  },
);

/* =========================================================
   AUTH - LOGIN
========================================================= */

app.post(
  '/api/auth/login',
  async (req, res, next) => {
    try {
      const {
        email,
        password,
      } = req.body || {};

      const normalizedEmail =
        String(email || '').toLowerCase();

      const user =
        await prisma.user.findUnique({
          where: {
            email: normalizedEmail,
          },
        });

      if (
        !user ||
        user.status !== UserStatus.ACTIVE ||
        !(await bcrypt.compare(
          password || '',
          user.passwordHash,
        ))
      ) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      const token = sign(user);

      res.json({
        success: true,
        user: cleanUser(user),
        token,
      });
    } catch (error) {
      next(error);
    }
  },
);

/* =========================================================
   AUTH - CURRENT USER
========================================================= */

app.get(
  '/api/auth/me',
  auth,
  async (
    req: AuthRequest,
    res,
    next,
  ) => {
    try {
      const user =
        await prisma.user.findUnique({
          where: {
            id: req.user!.id,
          },
        });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.json({
        success: true,
        user: cleanUser(user),
      });
    } catch (error) {
      next(error);
    }
  },
);

/* =========================================================
   AUTH - CHANGE PASSWORD
========================================================= */

app.put(
  '/api/auth/password',
  auth,
  async (
    req: AuthRequest,
    res,
    next,
  ) => {
    try {
      const {
        currentPassword,
        newPassword,
        confirmPassword,
      } = req.body || {};

      const user =
        await prisma.user.findUnique({
          where: {
            id: req.user!.id,
          },
        });

      if (
        !user ||
        !(await bcrypt.compare(
          currentPassword || '',
          user.passwordHash,
        ))
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Current password is incorrect',
        });
      }

      const passwordResult = passwordSchema.safeParse(newPassword);

      if (!passwordResult.success) {
        return res.status(400).json({
          success: false,
          message: passwordResult.error.issues[0]?.message || 'Invalid new password',
          errors: passwordResult.error.flatten(),
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message:
            'New passwords do not match',
        });
      }

      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          passwordHash:
            await bcrypt.hash(
              newPassword,
              12,
            ),
        },
      });

      await notify(
        user.id,
        NotificationType.SYSTEM,
        'Password changed',
        'Your RateIQ password was changed successfully.',
      );

      res.json({
        success: true,
        message:
          'Password changed successfully',
      });
    } catch (error) {
      next(error);
    }
  },
);

/* =========================================================
   STORES - EXPLORE / SEARCH / FILTER / SORT
========================================================= */

app.get(
  '/api/stores',
  async (req, res, next) => {
    try {
      const stores =
        await prisma.store.findMany({
          where: storeWhere(req.query.q),

          include: {
            ratings: {
              select: {
                value: true,
                createdAt: true,
              },
            },

            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

      let result = stores.map(
        (store) => ({
          id: store.id,
          name: store.name,
          email: store.email,
          address: store.address,
          owner: store.owner,
          ...analytics(
            store.ratings,
          ),
        }),
      );

      const minRating =
        Number(
          req.query.minRating || 0,
        );

      const minHealth =
        Number(
          req.query.minHealth || 0,
        );

      const sort =
        String(
          req.query.sort || 'rating',
        );

      result = result.filter(
        (store) =>
          store.rating >= minRating &&
          store.health >= minHealth,
      );

      result.sort((a, b) => {
        if (sort === 'health') {
          return b.health - a.health;
        }

        if (sort === 'reviews') {
          return (
            b.ratingCount -
            a.ratingCount
          );
        }

        if (sort === 'confidence') {
          return (
            b.confidence -
            a.confidence
          );
        }

        if (sort === 'improved') {
          return (
            b.trend.change -
            a.trend.change
          );
        }

        return b.rating - a.rating;
      });

      res.json({
        success: true,
        count: result.length,
        stores: result,
      });
    } catch (error) {
      next(error);
    }
  },
);

/* =========================================================
   STORE - DETAILS
========================================================= */

app.get(
  '/api/stores/:id',
  async (req, res, next) => {
    try {
      const id = Number(
        req.params.id,
      );

      const store =
        await prisma.store.findUnique({
          where: {
            id,
          },

          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                address: true,
                role: true,
                status: true,
              },
            },

            ratings: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },

              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        });

      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found',
        });
      }

      res.json({
        success: true,

        store: {
          ...store,

          ratings:
            store.ratings.map(
              (rating) => ({
                id: rating.id,
                value: rating.value,
                createdAt:
                  rating.createdAt,
                user: rating.user,
              }),
            ),

          ...analytics(
            store.ratings,
          ),
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/* =========================================================
   STORE - HEALTH
========================================================= */

app.get(
  '/api/stores/:id/health',
  async (req, res, next) => {
    try {
      const store =
        await prisma.store.findUnique({
          where: {
            id: Number(
              req.params.id,
            ),
          },
          include: {
            ratings: true,
          },
        });

      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found',
        });
      }

      res.json({
        success: true,
        ...analytics(
          store.ratings,
        ),
      });
    } catch (error) {
      next(error);
    }
  },
);

/* =========================================================
   STORE - TRENDS
========================================================= */

app.get(
  '/api/stores/:id/trends',
  async (req, res, next) => {
    try {
      const store =
        await prisma.store.findUnique({
          where: {
            id: Number(
              req.params.id,
            ),
          },
          include: {
            ratings: true,
          },
        });

      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found',
        });
      }

      const series = Array.from(
        { length: 30 },
        (_, index) => {
          const date = new Date(
            Date.now() -
              (29 - index) *
                86400000,
          );

          const key =
            date.toDateString();

          const ratings =
            store.ratings.filter(
              (rating) =>
                new Date(
                  rating.createdAt,
                ).toDateString() ===
                key,
            );

          return {
            date:
              date
                .toISOString()
                .slice(0, 10),

            average:
              ratings.length
                ? Number(
                    (
                      ratings.reduce(
                        (sum, rating) =>
                          sum +
                          rating.value,
                        0,
                      ) /
                      ratings.length
                    ).toFixed(2),
                  )
                : null,

            count:
              ratings.length,
          };
        },
      );

      res.json({
        success: true,
        trend:
          analytics(
            store.ratings,
          ).trend,
        series,
      });
    } catch (error) {
      next(error);
    }
  },
);

/* =========================================================
   STORE - CONFIDENCE
========================================================= */

app.get(
  '/api/stores/:id/confidence',
  async (req, res, next) => {
    try {
      const store =
        await prisma.store.findUnique({
          where: {
            id: Number(
              req.params.id,
            ),
          },
          include: {
            ratings: true,
          },
        });

      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found',
        });
      }

      const result =
        analytics(
          store.ratings,
        );

      const level =
        result.confidence >= 75
          ? 'HIGH'
          : result.confidence >= 40
          ? 'MODERATE'
          : 'LOW';

      res.json({
        success: true,
        confidence:
          result.confidence,
        ratingCount:
          result.ratingCount,
        level,
      });
    } catch (error) {
      next(error);
    }
  },
);

/* =========================================================
   RATINGS - CREATE / UPDATE
========================================================= */

app.post(
  '/api/ratings',
  auth,
  roles(Role.USER),
  async (
    req: AuthRequest,
    res,
    next,
  ) => {
    try {
      const value = Number(
        req.body?.value,
      );

      const storeId = Number(
        req.body?.storeId,
      );

      if (
        ![1, 2, 3, 4, 5].includes(
          value,
        ) ||
        !Number.isInteger(
          storeId,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Rating must be an integer from 1 to 5',
        });
      }

      const store =
        await prisma.store.findUnique({
          where: {
            id: storeId,
          },
        });

      if (!store) {
        return res.status(404).json({
          success: false,
          message: 'Store not found',
        });
      }

      const existing =
        await prisma.rating.findUnique({
          where: {
            userId_storeId: {
              userId:
                req.user!.id,
              storeId,
            },
          },
        });

      if (existing) {
        const rating =
          await prisma.rating.update({
            where: {
              id: existing.id,
            },
            data: {
              value,
            },
          });

        await audit(
          req.user!.id,
          'UPDATE_RATING',
          'RATING',
          rating.id,
          {
            storeId,
            value,
          },
        );

        return res.json({
          success: true,
          message:
            'Rating updated successfully',
          rating,
        });
      }

      const rating =
        await prisma.rating.create({
          data: {
            value,
            userId:
              req.user!.id,
            storeId,
          },
        });

      if (store.ownerId) {
        await notify(
          store.ownerId,
          NotificationType.RATING,
          'New rating received',
          `A customer rated ${store.name} ${value} stars.`,
        );
      }

      await audit(
        req.user!.id,
        'CREATE_RATING',
        'RATING',
        rating.id,
        {
          storeId,
          value,
        },
      );

      res.status(201).json({
        success: true,
        message:
          'Rating submitted successfully',
        rating,
      });
    } catch (error) {
      next(error);
    }
  },
);

/* =========================================================
   USER - MY RATING FOR STORE
========================================================= */

app.get(
  '/api/stores/:id/my-rating',
  auth,
  roles(Role.USER),
  async (
    req: AuthRequest,
    res,
    next,
  ) => {
    try {
      const storeId = Number(
        req.params.id,
      );

      const rating =
        await prisma.rating.findUnique({
          where: {
            userId_storeId: {
              userId:
                req.user!.id,
              storeId,
            },
          },
        });

      res.json({
        success: true,
        rating,
      });
    } catch (error) {
      next(error);
    }
  },
);

/* =========================================================
   OWNER - DASHBOARD
========================================================= */

app.get(
  '/api/owner/dashboard',
  auth,
  roles(Role.OWNER),
  async (
    req: AuthRequest,
    res,
    next,
  ) => {
    try {
      const stores =
        await prisma.store.findMany({
          where: {
            ownerId:
              req.user!.id,
          },

          include: {
            ratings: true,
          },
        });

      res.json({
        success: true,

        stores: stores.map(
          (store) => {
            const result =
              analytics(
                store.ratings,
              );

            return {
              id: store.id,
              name: store.name,
              email: store.email,
              address: store.address,
              ...result,
              insight:
                insight(result),
            };
          },
        ),
      });
    } catch (error) {
      next(error);
    }
  },
);

/* =========================================================
   OWNER - RATINGS
========================================================= */

app.get(
  '/api/owner/ratings',
  auth,
  roles(Role.OWNER),
  async (
    req: AuthRequest,
    res,
    next,
  ) => {
    try {
      const ratings =
        await prisma.rating.findMany({
          where: {
            store: {
              ownerId:
                req.user!.id,
            },
          },

          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },

            store: {
              select: {
                id: true,
                name: true,
              },
            },
          },

          orderBy: {
            createdAt: 'desc',
          },
        });

      res.json({
        success: true,
        count:
          ratings.length,
        ratings,
      });
    } catch (error) {
      next(error);
    }
  },
);

/* =========================================================
   OWNER - ANALYTICS
========================================================= */

app.get(
  '/api/owner/analytics',
  auth,
  roles(Role.OWNER),
  async (
    req: AuthRequest,
    res,
    next,
  ) => {
    try {
      const stores =
        await prisma.store.findMany({
          where: {
            ownerId:
              req.user!.id,
          },

          include: {
            ratings: true,
          },
        });

      res.json({
        success: true,

        stores: stores.map(
          (store) => {
            const result =
              analytics(
                store.ratings,
              );

            return {
              id: store.id,
              name: store.name,
              ...result,
              insight:
                insight(result),
            };
          },
        ),
      });
    } catch (error) {
      next(error);
    }
  },
);

/* =========================================================
   OWNER - INSIGHTS
========================================================= */

app.get(
  '/api/owner/insights',
  auth,
  roles(Role.OWNER),
  async (
    req: AuthRequest,
    res,
    next,
  ) => {
    try {
      const stores =
        await prisma.store.findMany({
          where: {
            ownerId:
              req.user!.id,
          },

          include: {
            ratings: true,
          },
        });

      res.json({
        success: true,

        insights: stores.map(
          (store) => {
            const result =
              analytics(
                store.ratings,
              );

            return {
              storeId: store.id,
              store: store.name,
              insight:
                insight(result),
            };
          },
        ),
      });
    } catch (error) {
      next(error);
    }
  },
);

/* =========================================================
   ADMIN - OVERVIEW
========================================================= */

app.get(
  '/api/admin/overview',
  auth,
  roles(Role.ADMIN),
  async (
    _req,
    res,
    next,
  ) => {
    try {
      const [
        users,
        stores,
        ratings,
        activeUsers,
      ] = await Promise.all([
        prisma.user.count(),

        prisma.store.count(),

        prisma.rating.count(),

        prisma.user.count({
          where: {
            status:
              UserStatus.ACTIVE,
          },
        }),
      ]);

      const aggregate =
        await prisma.rating.aggregate({
          _avg: {
            value: true,
          },
        });

      res.json({
        success: true,
        users,
        stores,
        ratings,
        activeUsers,

        /*
         * Store has no status column in the current schema,
         * so this is currently the total store count.
         */
        activeStores: stores,

        averageRating:
          Number(
            (
              aggregate._avg.value ||
              0
            ).toFixed(2),
          ),
      });
    } catch (error) {
      next(error);
    }
  },
);

/* =========================================================
   ADMIN - USERS
========================================================= */

app.get(
  '/api/admin/users',
  auth,
  roles(Role.ADMIN),
  async (
    req,
    res,
    next,
  ) => {
    try {
      const where: any = {
        ...storeWhereUser(req.query.q),
        ...(req.query.role
          ? {
              role: String(req.query.role).toUpperCase() as Role,
            }
          : {}),
      };

      const users = await prisma.user.findMany({
        where,
        include: {
          ownedStores: {
            select: {
              id: true,
              name: true,
              ratings: { select: { value: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const enrichedUsers = users.map((user) => {
        const values = user.ownedStores.flatMap((store) =>
          store.ratings.map((rating) => rating.value),
        );
        const ownerRating = values.length
          ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2))
          : null;

        return {
          ...cleanUser(user),
          ownerStoreCount: user.ownedStores.length,
          ownerRating,
        };
      });

      res.json({
        success: true,
        count: enrichedUsers.length,
        users: enrichedUsers,
      });
    } catch (error) {
      next(error);
    }
  },
);

/* =========================================================
   ADMIN - CREATE USER
========================================================= */

app.post(
  '/api/admin/users',
  auth,
  roles(Role.ADMIN),
  async (
    req: AuthRequest,
    res,
    next,
  ) => {
    try {
      const parsed = userCreateSchema.safeParse({
        ...req.body,
        role: req.body?.role || Role.USER,
      });

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: parsed.error.issues[0]?.message || 'Validation failed',
          errors: parsed.error.flatten(),
        });
      }

      const { name, email, address, password, role } = parsed.data;

      const user = await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          address,
          passwordHash: await bcrypt.hash(password, 12),
          role,
          status: UserStatus.ACTIVE,
        },
      });

      await audit(req.user!.id, 'CREATE_USER', 'USER', user.id);

      res.status(201).json({ success: true, user: cleanUser(user) });
    } catch (error) {
      next(error);
    }
  },
);

/* =========================================================
   ADMIN - UPDATE USER
========================================================= */

app.put(
  '/api/admin/users/:id',
  auth,
  roles(Role.ADMIN),
  async (
    req: AuthRequest,
    res,
    next,
  ) => {
    try {
      const id = Number(req.params.id);
      const parsed = userUpdateSchema.safeParse(req.body || {});

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: parsed.error.issues[0]?.message || 'Validation failed',
          errors: parsed.error.flatten(),
        });
      }

      const { name, email, address, role, status, password } = parsed.data;

      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(email !== undefined ? { email: email.toLowerCase() } : {}),
          ...(address !== undefined ? { address } : {}),
          ...(role !== undefined ? { role: role as Role } : {}),
          ...(status !== undefined ? { status: status as UserStatus } : {}),
          ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}),
        },
      });

      await audit(req.user!.id, 'UPDATE_USER', 'USER', id, { role, status });

      res.json({ success: true, user: cleanUser(user) });
    } catch (error) {
      next(error);
    }
  },
);

/* =========================================================
   ADMIN - DEACTIVATE USER
========================================================= */

app.delete(
  '/api/admin/users/:id',
  auth,
  roles(Role.ADMIN),
  async (
    req: AuthRequest,
    res,
    next,
  ) => {
    try {
      const id = Number(
        req.params.id,
      );

      if (
        id === req.user!.id
      ) {
        return res.status(400).json({
          success: false,
          message:
            'You cannot deactivate your own account',
        });
      }

      const user =
        await prisma.user.update({
          where: {
            id,
          },

          data: {
            status:
              UserStatus.INACTIVE,
          },
        });

      await audit(
        req.user!.id,
        'DEACTIVATE_USER',
        'USER',
        id,
      );

      res.json({
        success: true,
        user:
          cleanUser(user),
      });
    } catch (error) {
      next(error);
    }
  },
);

/* =========================================================
   ADMIN - STORES
========================================================= */

app.get(
  '/api/admin/stores',
  auth,
  roles(Role.ADMIN),
  async (
    req,
    res,
    next,
  ) => {
    try {
      const stores =
        await prisma.store.findMany({
          where: storeWhere(
            req.query.q,
          ),

          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                address: true,
                role: true,
                status: true,
              },
            },

            ratings: true,
          },

          orderBy: {
            createdAt: 'desc',
          },
        });

      res.json({
        success: true,
        count:
          stores.length,

        stores: stores.map(
          (store) => ({
            id: store.id,
            name: store.name,
            email: store.email,
            address: store.address,
            owner: store.owner,
            ...analytics(
              store.ratings,
            ),
          }),
        ),
      });
    } catch (error) {
      next(error);
    }
  },
);

/* =========================================================
   ADMIN - CREATE STORE
========================================================= */

app.post(
  '/api/admin/stores',
  auth,
  roles(Role.ADMIN),
  async (
    req: AuthRequest,
    res,
    next,
  ) => {
    try {
      const parsed = storeCreateSchema.safeParse({
        ...req.body,
        ownerId: req.body?.ownerId ? Number(req.body.ownerId) : null,
      });

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: parsed.error.issues[0]?.message || 'Validation failed',
          errors: parsed.error.flatten(),
        });
      }

      const { name, email, address, ownerId } = parsed.data;
      const store = await prisma.store.create({
        data: { name, email: email.toLowerCase(), address, ownerId },
      });

      await audit(req.user!.id, 'CREATE_STORE', 'STORE', store.id);
      res.status(201).json({ success: true, store });
    } catch (error) {
      next(error);
    }
  },
);

/* =========================================================
   ADMIN - UPDATE STORE
========================================================= */

app.put(
  '/api/admin/stores/:id',
  auth,
  roles(Role.ADMIN),
  async (
    req: AuthRequest,
    res,
    next,
  ) => {
    try {
      const id = Number(req.params.id);
      const parsed = storeUpdateSchema.safeParse({
        ...req.body,
        ...(req.body?.ownerId !== undefined
          ? { ownerId: req.body.ownerId ? Number(req.body.ownerId) : null }
          : {}),
      });

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: parsed.error.issues[0]?.message || 'Validation failed',
          errors: parsed.error.flatten(),
        });
      }

      const { name, email, address, ownerId } = parsed.data;
      const store = await prisma.store.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(email !== undefined ? { email: email.toLowerCase() } : {}),
          ...(address !== undefined ? { address } : {}),
          ...(ownerId !== undefined ? { ownerId } : {}),
        },
      });

      await audit(req.user!.id, 'UPDATE_STORE', 'STORE', id);
      res.json({ success: true, store });
    } catch (error) {
      next(error);
    }
  },
);

/* =========================================================
   ADMIN - DELETE STORE
========================================================= */

app.delete(
  '/api/admin/stores/:id',
  auth,
  roles(Role.ADMIN),
  async (
    req: AuthRequest,
    res,
    next,
  ) => {
    try {
      const id = Number(
        req.params.id,
      );

      const store =
        await prisma.store.findUnique({
          where: {
            id,
          },
        });

      if (!store) {
        return res.status(404).json({
          success: false,
          message:
            'Store not found',
        });
      }

      await prisma.store.delete({
        where: {
          id,
        },
      });

      await audit(
        req.user!.id,
        'DELETE_STORE',
        'STORE',
        id,
        {
          name: store.name,
        },
      );

      res.json({
        success: true,
        message:
          'Store deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },
);

/* =========================================================
   ADMIN - RATINGS
========================================================= */

app.get(
  '/api/admin/ratings',
  auth,
  roles(Role.ADMIN),
  async (
    _req,
    res,
    next,
  ) => {
    try {
      const ratings =
        await prisma.rating.findMany({
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },

            store: {
              select: {
                id: true,
                name: true,
              },
            },
          },

          orderBy: {
            createdAt: 'desc',
          },
        });

      res.json({
        success: true,
        count:
          ratings.length,
        ratings,
      });
    } catch (error) {
      next(error);
    }
  },
);

/* =========================================================
   ADMIN - RISK CENTER
========================================================= */

app.get(
  '/api/admin/risks',
  auth,
  roles(Role.ADMIN),
  async (
    _req,
    res,
    next,
  ) => {
    try {
      const stores =
        await prisma.store.findMany({
          include: {
            ratings: true,
          },
        });

      const risks =
        stores
          .map((store) => ({
            ...anomaly(
              store.ratings,
            ),

            storeId:
              store.id,

            store:
              store.name,

            ...analytics(
              store.ratings,
            ),
          }))
          .filter(
            (item) =>
              item.unusual,
          )
          .sort(
            (a, b) =>
              b.deviation -
              a.deviation,
          );

      res.json({
        success: true,
        count:
          risks.length,
        risks,
      });
    } catch (error) {
      next(error);
    }
  },
);

/* =========================================================
   RISK CENTER
========================================================= */

app.get(
  '/api/risks',
  auth,
  roles(Role.ADMIN),
  async (
    _req,
    res,
    next,
  ) => {
    try {
      const stores =
        await prisma.store.findMany({
          include: {
            ratings: true,
          },
        });

      const risks =
        stores
          .map((store) => ({
            ...anomaly(
              store.ratings,
            ),

            storeId:
              store.id,

            store:
              store.name,

            ...analytics(
              store.ratings,
            ),
          }))
          .filter(
            (item) =>
              item.unusual,
          );

      res.json({
        success: true,
        count:
          risks.length,
        risks,
      });
    } catch (error) {
      next(error);
    }
  },
);

/* =========================================================
   AUDIT LOGS
========================================================= */

app.get(
  '/api/audit-logs',
  auth,
  roles(Role.ADMIN),
  async (
    _req,
    res,
    next,
  ) => {
    try {
      const logs =
        await prisma.auditLog.findMany({
          include: {
            actor: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },

          orderBy: {
            createdAt: 'desc',
          },

          take: 200,
        });

      res.json({
        success: true,
        count:
          logs.length,
        logs,
      });
    } catch (error) {
      next(error);
    }
  },
);

/* =========================================================
   NOTIFICATIONS
========================================================= */

app.get(
  '/api/notifications',
  auth,
  async (
    req: AuthRequest,
    res,
    next,
  ) => {
    try {
      const notifications =
        await prisma.notification.findMany({
          where: {
            userId:
              req.user!.id,
          },

          orderBy: {
            createdAt: 'desc',
          },

          take: 100,
        });

      res.json({
        success: true,
        count:
          notifications.length,
        notifications,
      });
    } catch (error) {
      next(error);
    }
  },
);

/* =========================================================
   NOTIFICATIONS - MARK READ
========================================================= */

app.patch(
  '/api/notifications/:id/read',
  auth,
  async (
    req: AuthRequest,
    res,
    next,
  ) => {
    try {
      const result =
        await prisma.notification.updateMany({
          where: {
            id: Number(
              req.params.id,
            ),

            userId:
              req.user!.id,
          },

          data: {
            isRead: true,
          },
        });

      res.json({
        success: true,
        updated:
          result.count,
      });
    } catch (error) {
      next(error);
    }
  },
);

/* =========================================================
   REPORTS
========================================================= */

app.get(
  '/api/reports/users',
  auth,
  roles(Role.ADMIN),
  async (
    _req,
    res,
    next,
  ) => {
    try {
      const rows =
        await prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
          },
        });

      res.json({
        success: true,
        rows,
      });
    } catch (error) {
      next(error);
    }
  },
);

app.get(
  '/api/reports/stores',
  auth,
  roles(Role.ADMIN),
  async (
    _req,
    res,
    next,
  ) => {
    try {
      const rows =
        await prisma.store.findMany({
          include: {
            ratings: true,

            owner: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        });

      res.json({
        success: true,

        rows: rows.map(
          (store) => ({
            id: store.id,
            name: store.name,
            email: store.email,
            address:
              store.address,
            owner:
              store.owner?.name ||
              '',
            ...analytics(
              store.ratings,
            ),
          }),
        ),
      });
    } catch (error) {
      next(error);
    }
  },
);

app.get(
  '/api/reports/ratings',
  auth,
  roles(Role.ADMIN),
  async (
    _req,
    res,
    next,
  ) => {
    try {
      const rows =
        await prisma.rating.findMany({
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },

            store: {
              select: {
                name: true,
              },
            },
          },
        });

      res.json({
        success: true,
        rows,
      });
    } catch (error) {
      next(error);
    }
  },
);

/* =========================================================
   PLATFORM ANALYTICS
========================================================= */

app.get(
  '/api/analytics/overview',
  async (
    _req,
    res,
    next,
  ) => {
    try {
      const stores =
        await prisma.store.findMany({
          include: {
            ratings: true,
          },
        });

      const allRatings =
        stores.flatMap(
          (store) =>
            store.ratings,
        );

      res.json({
        success: true,
        stores:
          stores.length,
        ...analytics(
          allRatings,
        ),
      });
    } catch (error) {
      next(error);
    }
  },
);

/* =========================================================
   404
========================================================= */

app.use(
  (_req, res) => {
    res.status(404).json({
      success: false,
      message:
        'API endpoint not found',
    });
  },
);

/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use(errorHandler);

/* =========================================================
   START SERVER
========================================================= */

app.listen(
  env.PORT,
  () => {
    console.log(
      `RateIQ API running on http://localhost:${env.PORT}`,
    );
  },
);

/* =========================================================
   GRACEFUL SHUTDOWN
========================================================= */

process.on(
  'SIGINT',
  async () => {
    await prisma.$disconnect();
    process.exit(0);
  },
);

process.on(
  'SIGTERM',
  async () => {
    await prisma.$disconnect();
    process.exit(0);
  },
);