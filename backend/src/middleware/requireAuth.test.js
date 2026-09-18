process.env.JWT_SECRET = 'test-secret';
const requireAuth = require('./requireAuth');
const { issueToken } = require('../services/authService');

function mockReqRes(authHeader) {
  const req = { headers: authHeader ? { authorization: authHeader } : {} };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  const next = jest.fn();
  return { req, res, next };
}

describe('requireAuth', () => {
  test('401 when Authorization header is missing', () => {
    const { req, res, next } = mockReqRes(undefined);
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('401 when the scheme is not Bearer', () => {
    const { req, res, next } = mockReqRes('Basic dXNlcjpwYXNz');
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('401 on a malformed token', () => {
    const { req, res, next } = mockReqRes('Bearer not-a-real-token');
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('calls next() and attaches userId/username on a valid token', () => {
    const { token } = issueToken({ _id: 'user-42', username: 'nandish' });
    const { req, res, next } = mockReqRes(`Bearer ${token}`);
    requireAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.userId).toBe('user-42');
    expect(req.username).toBe('nandish');
  });
});