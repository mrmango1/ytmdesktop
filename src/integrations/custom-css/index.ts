import { BrowserView } from "electron";
import fs from "fs";
import ElectronStore from "electron-store";

import IIntegration from "../integration";
import { StoreSchema } from "../../shared/store/schema";

export default class CustomCSS implements IIntegration {
  private ytmView: BrowserView;
  private store: ElectronStore<StoreSchema>;
  private isEnabled = false;

  private customCSSKey: string|null = null;
  private fileListener: fs.StatsListener|null = null;

  public provide(store: ElectronStore<StoreSchema>, ytmView: BrowserView): void {
    this.ytmView = ytmView;
    this.store = store;

    if (this.isEnabled && !this.customCSSKey) {
      this.enable();
    }
  }

  public enable(): void {
    this.isEnabled = true;
    if (this.ytmView === null || this.customCSSKey) return;

    const cssPath: string|null = this.store.get('appearance.customCSSPath');

    if (cssPath && fs.existsSync(cssPath)) {
      this.injectCSS(
        fs.readFileSync(cssPath, "utf8")
      );
    }
    else {
      console.error("Custom CSS file not found");
    }

    // Do not listen for changes to the custom CSS file if the user has
    // chosen to use the user's origin for the CSS
    // https://github.com/electron/electron/issues/27792
    // Listen to updates to the custom CSS file
    this.store.onDidChange('appearance', (oldState, newState) => {
      if (newState.customCSSEnabled && oldState.customCSSPath != newState.customCSSPath) {
        this.removeCSS();
        this.injectCSS(
          fs.readFileSync(newState.customCSSPath, "utf8")
        );

        this.watchCSSFile(newState.customCSSPath, oldState.customCSSPath);
      }
    });
    
    this.watchCSSFile(cssPath);
  }

  public disable(): void {
    this.removeCSS();
    this.isEnabled = false;

    if (this.fileListener) {
      fs.unwatchFile(this.store.get('appearance.customCSSPath'), this.fileListener);
      this.fileListener = null;
    }
  }

  public updateCSS(): void {
    if (this.isEnabled) {
      this.removeCSS();
      this.enable();
    }
  }

  // --------------------------------------------------

  private async injectCSS(content: string) {
    this.ytmView.webContents.on('did-finish-load', async () => {
      if (this.customCSSKey) { return; }

      this.customCSSKey = await this.ytmView.webContents.insertCSS(content);
    });

    // View is Ready so we can inject the CSS
    this.customCSSKey = await this.ytmView.webContents.insertCSS(content);
  }

  private async removeCSS() {
    if (this.customCSSKey === null || !this.ytmView) return;

    await this.ytmView.webContents.removeInsertedCSS(this.customCSSKey);
    this.customCSSKey = null;
  }

  private async watchCSSFile(newFile: string, oldFile?: string) {
    // Reset the file listener if it exists
    if (this.fileListener && oldFile) {
      fs.unwatchFile(oldFile, this.fileListener);
      this.fileListener = null;
    }

    // Watch for changes to the custom CSS file
    // and update the CSS when it changes
    this.fileListener = (curr: fs.Stats, prev: fs.Stats) => {
      if (curr.mtimeMs != prev.mtimeMs) {
        this.updateCSS();
      }
    }
    fs.watchFile(newFile, { interval: 5000 }, this.fileListener);
  }
}
