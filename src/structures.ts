/*
 * Copyright (c) 2021 Marvin "NurMarvin" Witt
 * Licensed under the Open Software License version 3.0
 */
export class Packet {
  m: string;
  c: {
    [key: string]: any;
  };
}

export class AuthorInfo {
  name: string;
  uuid: string;
}

export class ErrorEventData {
  message:
    | 'NotSupported'
    | 'LoginFailed'
    | 'NotLoggedIn'
    | 'AlreadyLoggedIn'
    | 'MojangRequestMissing'
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

export class MessageEventData {
  author: AuthorInfo;
  content: string;
}

export class MojangInfoEventData {
  sessionHash: string;
}

export class NewJWTEventData {
  token: string;
}

export class SuccessEventData {
  reason: 'Login' | 'Ban' | 'Unban';
}

export class UserCountEventData {
  connections: number;
  loggedIn: number;
}

export class MojangAuthenticationResponse {
  user?: {
    username: string;
    properties: [
      {
        name: string;
        value: string;
      }
    ];
    id: string;
  };
  clientToken: string;
  accessToken: string;
  availableProfiles: Profile[];
  selectedProfile: Profile;
}

export class Profile {
  name: string;
  id: string;
}
