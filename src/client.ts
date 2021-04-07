/*
 * Copyright (c) 2021 Marvin "NurMarvin" Witt
 * Licensed under the Open Software License version 3.0
 */
import axios from 'axios';
import { EventEmitter } from 'events';
import WebSocket from 'isomorphic-ws';

import {
  ErrorEventData,
  MessageEventData,
  MojangAuthenticationResponse,
  MojangInfoEventData,
  NewJWTEventData,
  Packet,
  SuccessEventData,
  UserCountEventData,
} from './structures';

export default interface Client {
  on(event: 'open', listener: (webSocket: WebSocket) => void): this;
  on(event: 'rawPacket', listener: (data: string) => void): this;
  on(event: 'packet', listener: (packet: Packet) => void): this;
  on(event: 'error', listener: (data: ErrorEventData) => void): this;
  on(event: 'message', listener: (data: MessageEventData) => void): this;
  on(event: 'mojangInfo', listener: (data: MojangInfoEventData) => void): this;
  on(event: 'newJWT', listener: (data: NewJWTEventData) => void): this;
  on(event: 'privateMessage', listener: (data: MessageEventData) => void): this;
  on(event: 'success', listener: (data: SuccessEventData) => void): this;
  on(event: 'userCount', listener: (data: UserCountEventData) => void): this;
}

export default class Client extends EventEmitter {
  private webSocket: WebSocket;

  constructor() {
    super();
  }

  connect(webSocketUrl: string) {
    this.webSocket = new WebSocket(webSocketUrl);

    this.webSocket.on('open', () => this.handleOpen());
    this.webSocket.on('message', (data) => this.handleMessage(data.toString()));
  }

  private handleOpen() {
    this.emit('open', this.webSocket);
  }

  private handleMessage(data: string) {
    this.emit('rawPacket', data);

    const packet = JSON.parse(data) as Packet;

    this.emit('packet', packet);

    switch (packet.m) {
      case 'Error': {
        this.emit('error', packet.c);
        break;
      }
      case 'Message': {
        this.emit('message', { author: packet.c.author_info, content: packet.c.content });
        break;
      }
      case 'MojangInfo': {
        this.emit('mojangInfo', { sessionHash: packet.c.session_hash });
        break;
      }
      case 'NewJWT': {
        this.emit('newJWT', packet.c);
        break;
      }
      case 'PrivateMessage': {
        this.emit('privateMessage', { author: packet.c.author_info, content: packet.c.content });
        break;
      }
      case 'Success': {
        this.emit('success', packet.c);
        break;
      }
      case 'UserCount': {
        this.emit('userCount', { connections: packet.c.connections, loggedIn: packet.c.logged_in });
        break;
      }
    }
  }

  /**
   * Login using a [json web token](https://jwt.io).
   * @param token Can be retrieved by sending a `RequestJWT` packet on an already authenticated connection.
   * @param allowMessages If `true`, other clients may send private messages to this client. Defaults to `false`.
   */
  loginJWT(token: string, allowMessages: boolean = false) {
    this.sendPacket('LoginJWT', { token, allow_messages: allowMessages });
  }

  /**
   * Login using a Mojang account.
   *
   * Requires the authentication flow to be completed. This can be started with the `requestMojangInfo` function.
   * @param name The username of the user.
   * @param uuid The UUID of the user with `-`.
   * @param allowMessages If `true`, other clients may send private messages to this client. Defaults to `false`.
   */
  loginMojang(name: string, uuid: string, allowMessages: boolean = false) {
    this.sendPacket('LoginMojang', { name, uuid, allow_messages: allowMessages });
  }

  /**
   * Request the session hash from the AxoChat server in order to start authenticating via Mojang.
   *
   * A `mojangInfo` event will be emitted on the client if the server received the request and was able to process it.
   *
   * Afterwards it's advised to use the `authenticateMojang` function to authenticate with Mojang, though this may be skipped
   * if you already have an `accessToken` for the account you are trying to connect to AxoChat, hence you should instead use the `joinServer`
   * function to join the AxoServer.
   */
  requestMojangInfo() {
    this.sendPacket('RequestMojangInfo');
  }

  /**
   * Authenticates a user with Mojang's auth server using their password.
   *
   * Afterwards it's advised to use the `joinServer` function.
   * @param username The username of the Mojang account.
   * @param password The password of the Mojang account.
   */
  async authenticateMojang(username: string, password: string): Promise<MojangAuthenticationResponse> {
    return await axios.post(
      'https://authserver.mojang.com/authenticate',
      {
        agent: {
          name: 'Minecraft',
          version: 1,
        },
        username,
        password,
        requestUser: true,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  /**
   * Joins the AxoChat server.
   *
   * Afterwards it's advised to login to the AxoChat server using the `loginMojang` function.
   * @param accessToken The access token of the account to join the AxoChat server with.
   * @param selectedProfile The UUID (without `-`) of the user to authenticate as.
   * @param sessionHash The session hash provided by the AxoChat server earlier in the authentication process.
   */
  async joinServer(accessToken: string, selectedProfile: string, sessionHash: string) {
    axios.post(
      'https://sessionserver.mojang.com/session/minecraft/join',
      {
        accessToken,
        selectedProfile,
        serverId: sessionHash,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  /**
   * Sends a public message in AxoChat.
   * @param message The messsage to send.
   */
  sendMessage(content: string) {
    this.sendPacket('Message', { content });
  }

  /**
   * Sends a private message in AxoChat.
   * @param receiver The name of the user that should receive the message.
   * @param message The messsage to send.
   */
  sendPrivateMessage(receiver: string, message: string) {
    this.sendPacket('PrivateMessage', { message, receiver });
  }

  /**
   * Requests a json web token that's used to login using the `loginJWT` function.
   * This requires the client to be already authenticated with the AxoChat server.
   * The server will emit a `newJWT` event to the client if it has received the request and the user is authenticated.
   */
  requestJWT() {
    this.sendPacket('RequestJWT');
  }

  /**
   * Requests the current user count.
   *
   * The server will emit a `userCount` event to the client if it has received the request.
   */
  requestUserCount() {
    this.sendPacket('RequestUserCount');
  }

  /**
   * Bans a user.
   *
   * Requires moderator permissions in the AxoChat server.
   * @param uuid The UUID (with `-`) of the user to ban.
   */
  banUser(uuid: string) {
    this.sendPacket('UnbanUser', { uuid });
  }

  /**
   * Unbans a user.
   *
   * Requires moderator permissions in the AxoChat server.
   * @param uuid The UUID (with `-`) of the user to unban.
   */
  unbanUser(uuid: string) {
    this.sendPacket('UnbanUser', { uuid });
  }

  /**
   * Sends a raw packet to AxoChat server.
   *
   * Shouldn't be used outside of internal usage unless you know what you're doing.
   * @param packetName The name of the packet to send
   * @param data The data of the packet to send
   */
  sendPacket(packetName: string, data?: any) {
    this.webSocket.send(
      JSON.stringify({
        m: packetName,
        c: data,
      })
    );
  }
}
