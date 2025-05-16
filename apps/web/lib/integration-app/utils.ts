import jwt, { Algorithm } from 'jsonwebtoken';

const WORKSPACE_KEY = 'd431f2f3-9e1d-4d60-ae27-b64e82d87a81';
const WORKSPACE_SECRET =
  '964638ae0cb0501e0022b914cd7315f78ad8b51de8bebf942ce15f3b2c79bbb6';

interface TokenData {
  id: string;
  name: string;
}

export function generateIntegrationToken({
  customerId,
  customerName,
}: {
  customerId: string;
  customerName: string;
}) {
  const tokenData: TokenData = {
    id: customerId,
    name: customerName,
  };

  const options = {
    issuer: WORKSPACE_KEY,
    expiresIn: 7200,
    algorithm: 'HS512' as Algorithm,
  };

  return jwt.sign(tokenData, WORKSPACE_SECRET!, options);
}
