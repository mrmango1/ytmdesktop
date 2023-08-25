{
  let ytmdControlButtons = {};

  let currentVideoId = "";

  let libraryFeedbackDefaultToken = "";
  let libraryFeedbackToggledToken = "";

  let sleepTimerTimeout = null;

  let libraryButton = document.createElement("yt-button-shape");
  libraryButton.classList.add("ytmd-player-bar-control");
  libraryButton.classList.add("library-button");
  libraryButton.set("data", {
    focused: false,
    iconPosition: "icon-only",
    onTap: function () {
      var closePopoupEvent = {
        bubbles: true,
        cancelable: false,
        composed: true,
        detail: {
          actionName: "yt-close-popups-action",
          args: [["ytmusic-menu-popup-renderer"]],
          optionalAction: false,
          returnValue: []
        }
      };
      var feedbackEvent = {
        bubbles: true,
        cancelable: false,
        composed: true,
        detail: {
          actionName: "yt-service-request",
          args: [
            this,
            {
              feedbackEndpoint: {
                feedbackToken: this.data.toggled ? libraryFeedbackToggledToken : libraryFeedbackDefaultToken
              }
            }
          ],
          optionalAction: false,
          returnValue: []
        }
      };
      this.dispatchEvent(new CustomEvent("yt-action", closePopoupEvent));
      this.dispatchEvent(new CustomEvent("yt-action", feedbackEvent));
      document.querySelector("ytmusic-player-bar").store.dispatch({
        type: "SET_FEEDBACK_TOGGLE_STATE",
        payload: { defaultEndpointFeedbackToken: libraryFeedbackDefaultToken, isToggled: !this.data.toggled }
      });
    }.bind(libraryButton),
    style: "mono",
    toggled: false,
    type: "text"
  });
  document.querySelector("ytmusic-player-bar").querySelector("ytmusic-like-button-renderer").insertAdjacentElement("afterend", libraryButton);

  let playlistButton = document.createElement("yt-button-shape");
  playlistButton.classList.add("ytmd-player-bar-control");
  playlistButton.classList.add("playlist-button");
  playlistButton.set("icon", "yt-sys-icons:playlist_add");
  playlistButton.set("data", {
    focused: false,
    iconPosition: "icon-only",
    onTap: function () {
      var closePopoupEvent = {
        bubbles: true,
        cancelable: false,
        composed: true,
        detail: {
          actionName: "yt-close-popups-action",
          args: [["ytmusic-menu-popup-renderer"]],
          optionalAction: false,
          returnValue: []
        }
      };
      var returnValue = [];
      var serviceRequestEvent = {
        bubbles: true,
        cancelable: false,
        composed: true,
        detail: {
          actionName: "yt-service-request",
          args: [
            this,
            {
              addToPlaylistEndpoint: {
                videoId: currentVideoId
              }
            }
          ],
          optionalAction: false,
          returnValue
        }
      };
      this.dispatchEvent(new CustomEvent("yt-action", closePopoupEvent));
      this.dispatchEvent(new CustomEvent("yt-action", serviceRequestEvent));
      returnValue[0].ajaxPromise.then(
        response => {
          var addToPlaylistEvent = {
            bubbles: true,
            cancelable: false,
            composed: true,
            detail: {
              actionName: "yt-open-popup-action",
              args: [
                {
                  openPopupAction: {
                    popup: {
                      addToPlaylistRenderer: response.data.contents[0].addToPlaylistRenderer
                    },
                    popupType: "DIALOG"
                  }
                },
                this
              ],
              optionalAction: false,
              returnValue: []
            }
          };
          this.dispatchEvent(new CustomEvent("yt-action", addToPlaylistEvent));
          this.dispatchEvent(new CustomEvent("yt-action", closePopoupEvent));
        },
        () => {
          // service request errored
        },
        this
      );
    }.bind(playlistButton),
    style: "mono",
    toggled: false,
    type: "text"
  });
  libraryButton.insertAdjacentElement("afterend", playlistButton);

  document.querySelector("ytmusic-player-bar").playerApi_.addEventListener("onVideoDataChange", event => {
    if (event.type === "dataloaded" && event.playertype === 1) {
      currentVideoId = document.querySelector("ytmusic-player-bar").playerApi_.getPlayerResponse().videoDetails.videoId;
    }
  });

  let rightControls = document.querySelector("ytmusic-player-bar").querySelector(".right-controls-buttons");
  let sleepTimerButton = document.createElement("tp-yt-paper-icon-button");
  sleepTimerButton.setAttribute("title", "Sleep timer off");
  sleepTimerButton.classList.add("ytmusic-player-bar");
  sleepTimerButton.classList.add("ytmd-player-bar-control");
  sleepTimerButton.classList.add("sleep-timer-button");
  sleepTimerButton.set("icon", "yt-sys-icons:stopwatch");
  sleepTimerButton.onclick = () => {
    sleepTimerButton.dispatchEvent(
      new CustomEvent("yt-action", {
        bubbles: true,
        cancelable: false,
        composed: true,
        detail: {
          actionName: "yt-open-popup-action",
          args: [
            {
              openPopupAction: {
                popup: {
                  menuPopupRenderer: {
                    accessibilityData: {
                      label: "Action menu"
                    },
                    items: [
                      {
                        menuServiceItemRenderer: {
                          icon: {
                            iconType: "CLOCK"
                          },
                          serviceEndpoint: {
                            ytmdSleepTimerServiceEndpoint: {
                              time: 5
                            }
                          },
                          text: {
                            runs: [
                              {
                                text: "5 minutes"
                              }
                            ]
                          }
                        }
                      },
                      {
                        menuServiceItemRenderer: {
                          icon: {
                            iconType: "CLOCK"
                          },
                          serviceEndpoint: {
                            ytmdSleepTimerServiceEndpoint: {
                              time: 10
                            }
                          },
                          text: {
                            runs: [
                              {
                                text: "10 minutes"
                              }
                            ]
                          }
                        }
                      },
                      {
                        menuServiceItemRenderer: {
                          icon: {
                            iconType: "CLOCK"
                          },
                          serviceEndpoint: {
                            ytmdSleepTimerServiceEndpoint: {
                              time: 15
                            }
                          },
                          text: {
                            runs: [
                              {
                                text: "15 minutes"
                              }
                            ]
                          }
                        }
                      },
                      {
                        menuServiceItemRenderer: {
                          icon: {
                            iconType: "CLOCK"
                          },
                          serviceEndpoint: {
                            ytmdSleepTimerServiceEndpoint: {
                              time: 30
                            }
                          },
                          text: {
                            runs: [
                              {
                                text: "30 minutes"
                              }
                            ]
                          }
                        }
                      },
                      {
                        menuServiceItemRenderer: {
                          icon: {
                            iconType: "CLOCK"
                          },
                          serviceEndpoint: {
                            ytmdSleepTimerServiceEndpoint: {
                              time: 45
                            }
                          },
                          text: {
                            runs: [
                              {
                                text: "45 minutes"
                              }
                            ]
                          }
                        }
                      },
                      {
                        menuServiceItemRenderer: {
                          icon: {
                            iconType: "CLOCK"
                          },
                          serviceEndpoint: {
                            ytmdSleepTimerServiceEndpoint: {
                              time: 60
                            }
                          },
                          text: {
                            runs: [
                              {
                                text: "1 hour"
                              }
                            ]
                          }
                        }
                      },
                      sleepTimerTimeout !== null
                        ? {
                            menuServiceItemRenderer: {
                              icon: {
                                iconType: "DELETE"
                              },
                              serviceEndpoint: {
                                ytmdSleepTimerServiceEndpoint: {
                                  time: 0
                                }
                              },
                              text: {
                                runs: [
                                  {
                                    text: "Clear sleep timer"
                                  }
                                ]
                              }
                            }
                          }
                        : {}
                    ]
                  }
                },
                popupType: "DROPDOWN"
              }
            },
            sleepTimerButton
          ],
          optionalAction: false,
          returnValue: []
        }
      })
    );
  };
  rightControls.querySelector(".shuffle").insertAdjacentElement("afterend", sleepTimerButton);

  window.addEventListener("yt-action", e => {
    if (e.detail.actionName === "yt-service-request") {
      if (e.detail.args[1].ytmdSleepTimerServiceEndpoint) {
        if (sleepTimerTimeout !== null) {
          clearTimeout(sleepTimerTimeout);
          sleepTimerTimeout = null;
          if (sleepTimerButton.classList.contains("active")) {
            sleepTimerButton.classList.remove("active");
            sleepTimerButton.setAttribute("title", "Sleep timer off");
          }
        }

        if (e.detail.args[1].ytmdSleepTimerServiceEndpoint.time > 0) {
          if (!sleepTimerButton.classList.contains("active")) {
            sleepTimerButton.classList.add("active");
            sleepTimerButton.setAttribute("title", "Sleep timer " + e.detail.args[1].ytmdSleepTimerServiceEndpoint.time + " minutes");
          }

          sleepTimerTimeout = setTimeout(
            () => {
              sleepTimerTimeout = null;
              sleepTimerButton.classList.remove("active");
              sleepTimerButton.setAttribute("title", "Sleep timer off");

              if (document.querySelector("ytmusic-player-bar").playing_) {
                document.querySelector("ytmusic-player-bar").playerApi_.pauseVideo();

                document.body.dispatchEvent(
                  new CustomEvent("yt-action", {
                    bubbles: true,
                    cancelable: false,
                    composed: true,
                    detail: {
                      actionName: "yt-open-popup-action",
                      args: [
                        {
                          openPopupAction: {
                            popup: {
                              dismissableDialogRenderer: {
                                title: {
                                  runs: [
                                    {
                                      text: "Music paused"
                                    }
                                  ]
                                },
                                dialogMessages: [
                                  {
                                    runs: [
                                      {
                                        text: "Sleep timer expired and your music has been paused"
                                      }
                                    ]
                                  }
                                ]
                              }
                            },
                            popupType: "DIALOG"
                          }
                        },
                        document.querySelector("ytmusic-app")
                      ],
                      optionalAction: false,
                      returnValue: []
                    }
                  })
                );
              }
            },
            e.detail.args[1].ytmdSleepTimerServiceEndpoint.time * 1000 * 60
          );
        }
      }
    }
  });

  document.querySelector("ytmusic-player-bar").store.subscribe(() => {
    let state = document.querySelector("ytmusic-player-bar").store.getState();

    // Update library button for current data
    const currentMenu = document.querySelector("ytmusic-player-bar").getMenuRenderer();
    if (currentMenu) {
      if (playlistButton.classList.contains("hidden")) {
        playlistButton.classList.remove("hidden");
      }

      for (let i = 0; i < currentMenu.items.length; i++) {
        const item = currentMenu.items[i];
        if (item.toggleMenuServiceItemRenderer) {
          if (
            item.toggleMenuServiceItemRenderer.defaultIcon.iconType === "LIBRARY_SAVED" ||
            item.toggleMenuServiceItemRenderer.defaultIcon.iconType === "LIBRARY_ADD"
          ) {
            libraryFeedbackDefaultToken = item.toggleMenuServiceItemRenderer.defaultServiceEndpoint.feedbackEndpoint.feedbackToken;
            libraryFeedbackToggledToken = item.toggleMenuServiceItemRenderer.toggledServiceEndpoint.feedbackEndpoint.feedbackToken;

            if (
              state.toggleStates.feedbackToggleStates[libraryFeedbackDefaultToken] !== undefined &&
              state.toggleStates.feedbackToggleStates[libraryFeedbackDefaultToken] !== null
            ) {
              libraryButton.set("data.toggled", state.toggleStates.feedbackToggleStates[libraryFeedbackDefaultToken]);
            } else {
              libraryButton.set("data.toggled", false);
            }

            if (item.toggleMenuServiceItemRenderer.defaultIcon.iconType === "LIBRARY_SAVED") {
              // Default value is saved to library (false == remove from library, true == add to library)
              if (libraryButton.data.toggled) {
                libraryButton.set("icon", "yt-sys-icons:library_add");
              } else {
                libraryButton.set("icon", "yt-sys-icons:library_saved");
              }
            } else if (item.toggleMenuServiceItemRenderer.defaultIcon.iconType === "LIBRARY_ADD") {
              // Default value is add to library (false == add to library, true == remove from library)
              if (libraryButton.data.toggled) {
                libraryButton.set("icon", "yt-sys-icons:library_saved");
              } else {
                libraryButton.set("icon", "yt-sys-icons:library_add");
              }
            }

            if (libraryButton.classList.contains("hidden")) {
              libraryButton.classList.remove("hidden");
            }

            break;
          }
        }
      }
    } else {
      if (!libraryButton.classList.contains("hidden")) {
        libraryButton.classList.add("hidden");
      }
      if (!playlistButton.classList.contains("hidden")) {
        playlistButton.classList.add("hidden");
      }
    }
  });

  ytmdControlButtons.libraryButton = libraryButton;
}
