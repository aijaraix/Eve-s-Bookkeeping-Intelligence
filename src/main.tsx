import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Attach CSRF only to same-origin requests from a persisted account session.
const nativeFetch=window.fetch.bind(window);
let accountCsrf='';
window.fetch=async (resource, options)=>{
 const url=new URL(resource instanceof Request?resource.url:String(resource),window.location.href);
 const method=(options?.method||(resource instanceof Request?resource.method:'GET')).toUpperCase();
 if(accountCsrf&&url.origin===window.location.origin&&!['GET','HEAD','OPTIONS'].includes(method)){
  const headers=new Headers(options?.headers||(resource instanceof Request?resource.headers:undefined));
  headers.set('x-eve-csrf',accountCsrf);options={...options,headers};
 }
 return nativeFetch(resource,options);
};
async function mount(){
 try{const response=await nativeFetch('/api/access/session');if(response.ok)accountCsrf=(await response.json()).csrf||'';}catch{/* Existing development PIN remains available. */}
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
}
void mount();
