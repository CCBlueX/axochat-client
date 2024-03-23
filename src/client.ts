/*
 * Copyright (c) 2021-2024 Marvin "NurMarvin" Witt
 * Licensed under the Open Software License version 3.0
 */
import { EventEmitter } from 'events';
import { WebSocket, CloseEvent } from 'isomorphic-ws';

import {
  NotConnectedError,
  type ErrorEventData,
  type MessageEventData,
  type NewJWTEventData,
  type Packet,
  type SuccessEventData,
  type UserCountEventData,
} from './structures';

interface Client {
  on(event: 'open', listener: (webSocket: WebSocket) => void): this;
  on(event: 'close', listener: (event: CloseEvent) => void): this;
  on(event: 'rawPacket', listener: (data: string) => void): this;
  on(event: 'packet', listener: (packet: Packet) => void): this;
  on(event: 'error', listener: (data: ErrorEventData) => void): this;
  on(event: 'message', listener: (data: MessageEventData) => void): this;
  on(event: 'newJWT', listener: (data: NewJWTEventData) => void): this;
  on(event: 'privateMessage', listener: (data: MessageEventData) => void): this;
  on(event: 'success', listener: (data: SuccessEventData) => void): this;
  on(event: 'userCount', listener: (data: UserCountEventData) => void): this;
}

class Client extends EventEmitter {
  private webSocket: WebSocket | null = null;

  constructor() {
    super();
  }

  /**
   * Connects the client to the provided AxoChat server.
   * @param webSocketUrl The websocket URL of the AxoChat server to connect to
   */
  connect(webSocketUrl: string) {
    this.webSocket = new WebSocket(webSocketUrl);

    this.webSocket.on('open', this.handleOpen.bind(this));
    this.webSocket.on('message', (data) => this.handleMessage(data.toString()));
    this.webSocket.on('close', this.handleClose.bind(this));
  }

  /**
   * Disconnects the client from the currently connected AxoChat server.
   */
  disconnect() {
    this.webSocket?.close();
    this.webSocket = null;
  }

  private handleOpen() {
    this.emit('open', this.webSocket);
  }

  private handleClose(event: CloseEvent) {
    this.emit('close', event);
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
    this.sendPacket('BanUser', { user: uuid });
  }

  /**
   * Unbans a user.
   *
   * Requires moderator permissions in the AxoChat server.
   * @param uuid The UUID (with `-`) of the user to unban.
   */
  unbanUser(uuid: string) {
    this.sendPacket('UnbanUser', { user: uuid });
  }

  /**
   * Sends a raw packet to AxoChat server.
   *
   * Shouldn't be used outside of internal usage unless you know what you're doing.
   * @param packetName The name of the packet to send
   * @param data The data of the packet to send
   */
  sendPacket(packetName: string, data?: any) {
    if (!this.webSocket) throw new NotConnectedError();

    this.webSocket.send(
      JSON.stringify({
        m: packetName,
        c: data,
      }),
    );
  }
}

export default Client;
