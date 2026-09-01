export type Role='ADMIN'|'USER'|'OWNER';
export type User={id:number;name:string;email:string;address:string;role:Role;status:string;createdAt?:string};
export type Store={id:number;name:string;email:string;address:string;owner?:User|null;rating:number;ratingCount:number;confidence:number;health:number;distribution:{rating:number;count:number}[];trend:{current:number;previous:number;change:number;direction:string}};
