import { atom } from 'recoil';

export const currentTrackIdState = atom({
  key: 'currentTrackIdState',
  default: null,
});

export const currentTrackDurationMsState = atom({
  key: 'currentTrackDurationMsState',
  default: 0,
});

export const isPlayingState = atom({
  key: 'isPlayingState',
  default: false,
});
