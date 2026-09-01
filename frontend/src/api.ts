import axios from 'axios';
export const api=axios.create({baseURL:import.meta.env.VITE_API_URL||'http://localhost:5000/api',timeout:10000});
api.interceptors.request.use(c=>{const t=localStorage.getItem('rateiq_token');if(t)c.headers.Authorization=`Bearer ${t}`;return c});
export async function get<T>(url:string,params?:Record<string,unknown>){return (await api.get<T>(url,{params})).data}
export async function post<T>(url:string,data?:unknown){return (await api.post<T>(url,data)).data}
export async function put<T>(url:string,data?:unknown){return (await api.put<T>(url,data)).data}
export async function patch<T>(url:string,data?:unknown){return (await api.patch<T>(url,data)).data}
export async function del<T>(url:string){return (await api.delete<T>(url)).data}
export function errorMessage(e:unknown){const x=e as any;return x?.response?.data?.message||x?.message||'We could not complete that request.'}
