import {
  HeartIcon,
  VolumeUpIcon as VolumeDownIcon,
  VolumeOffIcon,
} from '@heroicons/react/outline';
import {
  FastForwardIcon,
  PauseIcon,
  PlayIcon,
  ReplyIcon as ReplayIcon,
  RewindIcon,
  VolumeUpIcon,
  SwitchHorizontalIcon,
} from '@heroicons/react/solid';
import { debounce } from 'lodash';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import {
  currentTrackDurationMsState,
  currentTrackIdState,
  isPlayingState,
} from '../atoms/songAtom';
import useSongInfo from '../hooks/useSongInfo';
import useSpotify from '../hooks/useSpotify';
import { millisToMinutesAndSeconds } from '../lib/time';

const Player = () => {
  const spotifyApi = useSpotify();
  const { data: session, status } = useSession();
  const [currentTrackId, setCurrentTrackId] =
    useRecoilState(currentTrackIdState);
  const [currentTrackDurationMs, setCurrentTrackDurationMs] = useRecoilState(
    currentTrackDurationMsState
  );
  const [isPlaying, setIsPlaying] = useRecoilState(isPlayingState);
  const [volume, setVolume] = useState(50);

  const [currentTrackProgressMs, setCurrentTrackProgressMs] = useState(0);
  const [playbackPosition, setPlaybackPosition] = useState(0);

  const songInfo = useSongInfo();

  const fetchCurrentSong = () => {
    if (!songInfo) {
      spotifyApi.getMyCurrentPlayingTrack().then((data) => {
        setCurrentTrackId(data.body?.item.id);
        setCurrentTrackDurationMs(data.body?.item.duration_ms);
        spotifyApi.getMyCurrentPlaybackState().then((data) => {
          setIsPlaying(data.body?.is_playing);
        });
      });
    }
  };

  const handlePlayPause = () => {
    spotifyApi.getMyCurrentPlaybackState().then((data) => {
      if (data.body.is_playing) {
        spotifyApi.pause();
        setIsPlaying(false);
      } else {
        spotifyApi.play();
        setIsPlaying(true);
      }
    });
  };

  useEffect(() => {
    if (spotifyApi.getAccessToken && !currentTrackId) {
      fetchCurrentSong();
      setVolume(50);
    }
  }, [currentTrackId, spotifyApi, session]);

  useEffect(() => {
    if (volume > 0 && volume < 100) {
      debouncedAdjustVolume(volume);
    }
  }, [volume]);

  useEffect(() => {
    debouncedSeek(playbackPosition * 1000);
  }, [playbackPosition]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying) {
        spotifyApi.getMyCurrentPlaybackState().then((data) => {
          setCurrentTrackProgressMs(data.body?.progress_ms);

          if (!data.body?.is_playing) {
            setIsPlaying(false);
            setPlaybackPosition(0);
          }
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const debouncedAdjustVolume = useCallback(
    debounce((volume) => {
      spotifyApi.setVolume(volume).catch((err) => {});
    }, 500),
    []
  );

  const debouncedSeek = useCallback(
    debounce((position) => {
      spotifyApi.seek(position).catch((err) => {});
    }, 500),
    []
  );

  return (
    <div className="h-24 bg-gradient-to-b from-black to-gray-900 text-white grid grid-cols-3 text-xs md:text-base px-2 md:px-8">
      {/* left */}
      <div className="flex items-center space-x-4">
        <img
          className="hidden md:inline h-10 w-10"
          src={songInfo?.album.images?.[0]?.url}
          alt=""
        />
        <div className="truncate">
          <h3>{songInfo?.name}</h3>
          <p>{songInfo?.artists?.[0]?.name}</p>
        </div>
        <div className="hidden xl:inline">
          <HeartIcon className="button" />
        </div>
      </div>

      {/* center */}
      <div className="grid grid-rows-2">
        <div className="flex items-center justify-center space-x-4">
          <SwitchHorizontalIcon className="button" />
          <RewindIcon
            // TODO: check this, below API is not working
            // onClick={() => spotifyApi.skipToPrevious()}
            className="button"
          />
          {isPlaying ? (
            <PauseIcon className="button w-10 h-10" onClick={handlePlayPause} />
          ) : (
            <PlayIcon className="button w-10 h-10" onClick={handlePlayPause} />
          )}
          <FastForwardIcon
            // TODO: check this, below API is not working
            // onClick={() => spotifyApi.skipToNext()}
            className="button"
          />
          <ReplayIcon className="button" />
        </div>
        <div className="flex justify-center items-center space-x-3 text-sm">
          <div className="w-8 text-left">
            <p>{millisToMinutesAndSeconds(currentTrackProgressMs)}</p>
          </div>
          <input
            className="w-36 md:w-40 lg:w-80"
            type="range"
            value={playbackPosition}
            min={0}
            max={currentTrackDurationMs / 1000}
            onChange={(e) => setPlaybackPosition(Number(e.target.value))}
          />
          <div className="w-8 text-right">
            <p>{millisToMinutesAndSeconds(currentTrackDurationMs)}</p>
          </div>
        </div>
      </div>

      {/* right */}
      <div className="flex items-center space-x-3 md:space-x-4 justify-end pr-5">
        {volume == 0 ? (
          <VolumeOffIcon className="button" />
        ) : (
          <VolumeDownIcon
            className="button"
            onClick={() => volume > 0 && setVolume(volume - 10)}
          />
        )}
        <input
          className="w-14 md:w-28"
          type="range"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          min={0}
          max={100}
        />

        <VolumeUpIcon
          className="button"
          onClick={() => volume < 100 && setVolume(volume + 10)}
        />
      </div>
    </div>
  );
};

export default Player;
