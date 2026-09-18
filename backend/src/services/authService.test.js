jest.mock('../models/User');
const User = require('../models/User');
const authService = require('./authService');

beforeEach(() => {
  process.env.JWT_SECRET = 'test-secret';
});
afterEach(() => jest.resetAllMocks());

describe('authService.register', () => {
  test('rejects a username under 3 characters', async () => {
    await expect(authService.register('ab', 'longenoughpassword')).rejects.toThrow(authService.AuthError);
  });

  test('rejects a password under 8 characters', async () => {
    await expect(authService.register('validname', 'short')).rejects.toThrow(authService.AuthError);
  });

  test('rejects a username that already exists', async () => {
    User.findOne.mockResolvedValue({ username: 'taken' });
    await expect(authService.register('taken', 'longenoughpassword')).rejects.toThrow(/already taken/);
  });

  test('hashes the password and issues a token on success', async () => {
    User.findOne.mockResolvedValue(null);
    User.hashPassword.mockResolvedValue('hashed-value');
    User.create.mockResolvedValue({ _id: 'abc123', username: 'newuser' });

    const result = await authService.register('newuser', 'longenoughpassword');

    expect(User.hashPassword).toHaveBeenCalledWith('longenoughpassword');
    expect(User.create).toHaveBeenCalledWith({ username: 'newuser', passwordHash: 'hashed-value' });
    expect(result).toHaveProperty('token');
    expect(result.username).toBe('newuser');
  });
});

describe('authService.login', () => {
  test('rejects an unknown username with a generic message (does not reveal which field was wrong)', async () => {
    User.findOne.mockResolvedValue(null);
    await expect(authService.login('ghost', 'whatever1')).rejects.toThrow('Invalid username or password');
  });

  test('rejects a wrong password with the same generic message', async () => {
    User.findOne.mockResolvedValue({ verifyPassword: jest.fn().mockResolvedValue(false) });
    await expect(authService.login('real', 'wrongpass')).rejects.toThrow('Invalid username or password');
  });

  test('issues a token on correct credentials', async () => {
    User.findOne.mockResolvedValue({ _id: 'abc123', username: 'real', verifyPassword: jest.fn().mockResolvedValue(true) });
    const result = await authService.login('real', 'correctpass');
    expect(result).toHaveProperty('token');
  });
});

describe('authService.verifyToken', () => {
  test('round-trips a token issued by issueToken', () => {
    const { token } = authService.issueToken({ _id: 'u1', username: 'roundtrip' });
    const payload = authService.verifyToken(token);
    expect(payload.sub).toBe('u1');
    expect(payload.username).toBe('roundtrip');
  });

  test('throws on a garbage token', () => {
    expect(() => authService.verifyToken('not-a-real-token')).toThrow();
  });
});