/*
 * Copyright (c) 2021-2024 Marvin "NurMarvin" Witt
 * Licensed under the Open Software License version 3.0
 */
export interface Packet {
  m: string;
  c: {
    [key: string]: any;
  };
}

export interface AuthorInfo {
  name: string;
  uuid: string;
}

export interface ErrorEventData {
  message:
    | 'NotSupported'
    | 'LoginFailed'
    | 'NotLoggedIn'
    | 'AlreadyLoggedIn'
    | 'NotPermitted'
    | 'NotBanned'
    | 'Banned'
    | 'RateLimited'
    | 'PrivateMessageNotAccepted'
    | 'EmptyMessage'
    | 'MessageTooLong'
    | 'InvalidCharacter'
    | 'InvalidId'
    | 'Internal';
}

export interface MessageEventData {
  author: AuthorInfo;
  content: string;
}

export interface NewJWTEventData {
  token: string;
}

export interface SuccessEventData {
  reason: 'Login' | 'Ban' | 'Unban';
}

export interface UserCountEventData {
  connections: number;
  loggedIn: number;
}

export interface Profile {
  name: string;
  id: string;
}

export class NotConnectedError extends Error {
  constructor() {
    super('The client is not connected to any server');
  }
}
