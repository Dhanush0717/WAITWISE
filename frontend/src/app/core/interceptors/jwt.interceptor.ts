import { HttpInterceptorFn } from '@angular/common/http';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('waitwise_token');
  const orgId = localStorage.getItem('waitwise_active_org_id');

  let headers = req.headers;

  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  if (orgId && !headers.has('x-organisation-id')) {
    headers = headers.set('x-organisation-id', orgId);
  }

  const clonedReq = req.clone({ headers });
  return next(clonedReq);
};
