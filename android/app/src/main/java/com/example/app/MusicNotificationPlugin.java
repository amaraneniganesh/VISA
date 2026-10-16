package com.example.app;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.IBinder;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "MusicNotification")
public class MusicNotificationPlugin extends Plugin {

    private MusicService musicService;
    private boolean isBound = false;

    private final ServiceConnection serviceConnection = new ServiceConnection() {
        @Override
        public void onServiceConnected(ComponentName name, IBinder service) {
            MusicService.MusicBinder binder = (MusicService.MusicBinder) service;
            musicService = binder.getService();
            isBound = true;

            musicService.setNotificationListener(new MusicService.NotificationListener() {
                @Override
                public void onPlay() {
                    JSObject ret = new JSObject();
                    ret.put("action", "play");
                    notifyListeners("onPlay", ret);
                }

                @Override
                public void onPause() {
                    JSObject ret = new JSObject();
                    ret.put("action", "pause");
                    notifyListeners("onPause", ret);
                }

                @Override
                public void onNext() {
                    JSObject ret = new JSObject();
                    ret.put("action", "next");
                    notifyListeners("onNext", ret);
                }

                @Override
                public void onPrevious() {
                    JSObject ret = new JSObject();
                    ret.put("action", "previous");
                    notifyListeners("onPrevious", ret);
                }

                @Override
                public void onSeekTo(long posMs) {
                    JSObject ret = new JSObject();
                    ret.put("position", posMs / 1000.0);
                    notifyListeners("onSeek", ret);
                }
            });
        }

        @Override
        public void onServiceDisconnected(ComponentName name) {
            isBound = false;
            musicService = null;
        }
    };

    @Override
    public void load() {
        super.load();
        Context context = getContext();
        Intent intent = new Intent(context, MusicService.class);
        context.startService(intent);
        context.bindService(intent, serviceConnection, Context.BIND_AUTO_CREATE);
    }

    @PluginMethod
    public void show(PluginCall call) {
        String title = call.getString("title", "VISA MUSIC");
        String artist = call.getString("artist", "Unknown Artist");
        String album = call.getString("album", "");
        String coverUrl = call.getString("coverUrl", "");
        Boolean isPlaying = call.getBoolean("isPlaying", true);
        Double positionSec = call.getDouble("position", 0.0);
        Double durationSec = call.getDouble("duration", 0.0);

        double posVal = positionSec != null ? positionSec : 0.0;
        double durVal = durationSec != null ? durationSec : 0.0;
        long positionMs = Math.round(posVal * 1000.0);
        long durationMs = Math.round(durVal * 1000.0);

        if (isBound && musicService != null) {
            musicService.updateNotification(title, artist, album, coverUrl, Boolean.TRUE.equals(isPlaying), positionMs, durationMs);
            call.resolve();
        } else {
            call.reject("Music service not bound yet");
        }
    }

    @PluginMethod
    public void updateState(PluginCall call) {
        Boolean isPlaying = call.getBoolean("isPlaying", true);
        String title = call.getString("title", null);
        String artist = call.getString("artist", null);
        String album = call.getString("album", null);
        String coverUrl = call.getString("coverUrl", null);
        Double positionSec = call.getDouble("position", 0.0);
        Double durationSec = call.getDouble("duration", 0.0);

        double posVal = positionSec != null ? positionSec : 0.0;
        double durVal = durationSec != null ? durationSec : 0.0;
        long positionMs = Math.round(posVal * 1000.0);
        long durationMs = Math.round(durVal * 1000.0);

        if (isBound && musicService != null) {
            musicService.updateNotification(title, artist, album, coverUrl, Boolean.TRUE.equals(isPlaying), positionMs, durationMs);
            call.resolve();
        } else {
            call.reject("Music service not bound yet");
        }
    }

    @PluginMethod
    public void dismiss(PluginCall call) {
        if (isBound && musicService != null) {
            musicService.dismissNotification();
            call.resolve();
        } else {
            call.resolve();
        }
    }

    @Override
    protected void handleOnDestroy() {
        if (isBound) {
            getContext().unbindService(serviceConnection);
            isBound = false;
        }
        super.handleOnDestroy();
    }
}
