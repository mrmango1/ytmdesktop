import { shell } from "electron";
import ElectronStore from "electron-store";
import fetch from "node-fetch";
import md5 from "md5";

import IIntegration from "../integration";
import { StoreSchema } from "../../shared/store/schema";

import playerStateStore from "../../player-state-store";

export default class LastFM implements IIntegration {
  private store: ElectronStore<StoreSchema>;

  private isEnabled = false;
  private lastDetails: any = null;
  private lastfmDetails: any = null;
  private scrobbleTimer: NodeJS.Timer|null = null;

  private async createToken(): Promise<string> {
    const data = {
      method: 'auth.gettoken',
      format: 'json',

      api_key: this.lastfmDetails.api_key,
    }
    const api_sig = this.createApiSig(data, this.lastfmDetails.secret);

    const response = await fetch(
      `https://ws.audioscrobbler.com/2.0/` +
        `?${this.createQueryString(data, api_sig)}`
    );

    const json: any = (await response.json());
    return json?.token;
  }

  private async authenticateUser() {
    this.lastfmDetails.token = await this.createToken();
    this.store.set('lastfm', this.lastfmDetails);

    shell.openExternal(
      `https://www.last.fm/api/auth/`+
        `?api_key=${encodeURIComponent(this.lastfmDetails.api_key)}`+
        `&token=${encodeURIComponent(this.lastfmDetails.token)}`
    );
  }

  private async getSession() {
    const params = {
      method: 'auth.getSession',
      format: 'json',
      api_key: this.lastfmDetails.api_key,
      token: this.lastfmDetails.token
    };

    const api_sig = this.createApiSig(params, this.lastfmDetails.secret);

    const response = await fetch(
      `https://ws.audioscrobbler.com/2.0/`+
        `?${this.createQueryString(params, api_sig)}`
    );

    const json: any = await response.json();

    if (json.error) {
      await this.authenticateUser();
    }
    else if (json.session) {
      this.lastfmDetails.sessionKey = json.session.key;
      this.store.set('lastfm', this.lastfmDetails);
    }
  }

  // ----------------------------------------------------------

  private async updateVideoDetails(state: any): Promise<void> {
    if (!this.isEnabled) { return; }

    if (state.videoDetails && state.trackState === 1) {
      // Check if the video has changed (TO DO: Fix song on repeat not scrobbling)
      if (this.lastDetails && this.lastDetails.videoId === state.videoDetails.videoId) {
        return;
      }
      this.lastDetails = state.videoDetails;
      clearTimeout(this.scrobbleTimer);

      this.updateNowPlaying(state.videoDetails);

      // Scrobble the track if it has been played for more than 50% of its duration
      // OR if it has been played for more than 4 minutes
      const scrobbleTimeRequired = Math.min(
        Math.round(state.videoDetails.lengthSeconds / 2),
        240
      );
      const scrobbleTime = new Date().getTime();

      this.scrobbleTimer = setTimeout(() => {
        this.scrobbleSong(state.videoDetails, scrobbleTime);
      }, scrobbleTimeRequired);
    }
  }

  private async updateNowPlaying(videoDetails: any): Promise<void> {
    const data = {
      method: 'track.updateNowPlaying',
    }

    this.sendToLastFM(videoDetails, data);
  }

  private async scrobbleSong(videoDetails: any, scrobbleTime: number): Promise<void> {
    const data = {
      method: 'track.scrobble',
      timestamp: Math.floor(scrobbleTime / 1000),
    }

    this.sendToLastFM(videoDetails, data);
  }

  private async sendToLastFM(videoDetails: any, params: any): Promise<void> {
    const data = {
      // Add specific data to the request
      ...params,

      artist: videoDetails.author,
      track: videoDetails.title,
      album: videoDetails.album,
      duration: videoDetails.lengthSeconds,
      // albumArtist, trackNumber, chosenByUser

      format: 'json',
      api_key: this.lastfmDetails.api_key,
      sk: this.lastfmDetails.sessionKey,
    }
    data.api_sig = this.createApiSig(data, this.lastfmDetails.secret);

    const response = fetch(
      `https://ws.audioscrobbler.com/2.0/`,
      {
        method: 'POST',
        body: this.createBody(data)
      }
    );
  
    response.catch((error: any) => {
      // Check Errors against https://www.last.fm/api/show/track.scrobble#errors
      switch(error.code) {
        case 9: // Invalid session key
          this.authenticateUser();
          break;

        default:
          console.error(error);
      }
    });
  }

  // ----------------------------------------------------------

  public provide(store: ElectronStore<StoreSchema>): void {
    this.store = store;
  }

  public enable(): void {
    if (this.isEnabled) { return; }
    this.isEnabled = true;

    this.lastfmDetails = this.store.get('lastfm');

    if (!this.lastfmDetails || !this.lastfmDetails.sessionKey) {
      this.getSession();
    }

    playerStateStore.addEventListener((state: any) => this.updateVideoDetails(state));
  }

  public disable(): void {
    if (!this.isEnabled) {
      return;
    }

    playerStateStore.removeEventListener((state: any) => this.updateVideoDetails(state));
    this.isEnabled = false;
  }

  /**
   * Format the data to be sent to the Last.fm API as a query string
   * @param params data to send
   * @param api_sig signature to append to the data
   * @returns URL encoded query string to be used in the request
   */
  private createQueryString(params: any, api_sig: string) {
    const data = [];
    params.api_sig = api_sig;

    for (const key in params) {
      data.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
    }
    return data.join('&');
  }

  private createBody(params: any) {
    const data = new URLSearchParams();
    for (const key in params) {
      data.append(key, params[key]);
    }
    return data;
  }

  /**
   * Create a Signature for the Last.fm API
   * @see {@link https://www.last.fm/api/authspec#_8-signing-calls} for details on how to create the signature
   * @param params Data to be signed
   * @param secret Secret key
   * @returns Signature for the data
   */
  private createApiSig(params: any, secret: string) {
    const keys = Object.keys(params).sort();
    const data = [];

    for (const key of keys) {
      // Ignore format and callback parameters
      if (key === 'format' || key === 'callback') { continue; }
      data.push(`${key}${params[key]}`);
    }

    data.push(secret);
    return md5(data.join(''));
  }
}
