export type Languages = 'en' | 'no';

export type Word = {
  start_time: number;
  end_time: number;
  text: string;
};

export interface ClientAuthorizationMessage {
  message: 'Authorization';
  api_key: string;
  language: Languages;
  name: string;
  partials: boolean;
  sample_rate: number;
}

export interface ServerAuthorizationMessage {
  message: 'RecognitionStarted';
  id: string;
}

export interface ServerTranscriptionMessage {
  message: 'PartialTranscript' | 'FinalTranscript';
  transcript: string;
  start_time: number;
  end_time: number;
  words: Word[];
}

export interface ServerEndOfTranscriptMessage {
  message: 'EndOfTranscript';
}

export interface ClientEndStreamMessage {
  message: 'EndOfStream';
}

export type ServerMessage =
  | ServerAuthorizationMessage
  | ServerTranscriptionMessage
  | ServerEndOfTranscriptMessage;
