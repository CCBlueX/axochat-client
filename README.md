# AxoChat Client

NPM Package: https://www.npmjs.com/package/@ccbluex/axochat-client

## Example Usage

> The LiquidBounce chat's certificate is self-signed, so you need to disable the certificate verification.

```typescript
import { Client } from '@ccbluex/axochat-client';

const client = new Client();

client.connect('wss://chat.liquidbounce.net:7886/ws');

client.on('open', () => {
  console.log('Connected!');

  client.loginJWT('TOKEN', true);

  client.on('success', ({ reason }) => {
    if (reason === 'Login') {
      client.on('message', (data) => {
        console.log(`${data.author.name}: ${data.content}`);
      });

      client.on('privateMessage', (data) => {
        console.log(`[PRIVATE] ${data.author.name}: ${data.content}`);
      });

      client.sendMessage('Hello, World!');
    }
  });

  client.on('error', ({ message }) => {
    console.log(`[ERROR] ${message}`);
  });
});
```
