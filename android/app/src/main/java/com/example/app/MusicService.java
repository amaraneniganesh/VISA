package com.example.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Binder;
import android.os.Build;
import android.os.IBinder;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.media.app.NotificationCompat.MediaStyle;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MusicService extends Service {

    public static final String CHANNEL_ID = "visa_music_channel";
    public static final int NOTIFICATION_ID = 1001;

    public static final String ACTION_PLAY = "com.example.app.ACTION_PLAY";
    public static final String ACTION_PAUSE = "com.example.app.ACTION_PAUSE";
    public static final String ACTION_NEXT = "com.example.app.ACTION_NEXT";
    public static final String ACTION_PREVIOUS = "com.example.app.ACTION_PREVIOUS";
    public static final String ACTION_STOP = "com.example.app.ACTION_STOP";

    private MediaSessionCompat mediaSession;
    private final IBinder binder = new MusicBinder();
    private NotificationListener listener;

    private String currentTitle = "VISA MUSIC";
    private String currentArtist = "Unknown Artist";
    private String currentAlbum = "";
    private String currentCoverUrl = "";
    private boolean isPlaying = false;
    private long currentPositionMs = 0;
    private long currentDurationMs = 0;
    private Bitmap currentCoverBitmap = null;

    private final ExecutorService imageExecutor = Executors.newSingleThreadExecutor();

    public interface NotificationListener {
        void onPlay();
        void onPause();
        void onNext();
        void onPrevious();
        void onSeekTo(long posMs);
    }

    public class MusicBinder extends Binder {
        public MusicService getService() {
            return MusicService.this;
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        initMediaSession();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Media Playback",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Shows currently playing song with controls");
            channel.setShowBadge(false);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private void initMediaSession() {
        mediaSession = new MediaSessionCompat(this, "VisaMusicSession");
        mediaSession.setFlags(
                MediaSessionCompat.FLAG_HANDLES_MEDIA_BUTTONS |
                MediaSessionCompat.FLAG_HANDLES_TRANSPORT_CONTROLS
        );

        mediaSession.setCallback(new MediaSessionCompat.Callback() {
            @Override
            public void onPlay() {
                if (listener != null) listener.onPlay();
            }

            @Override
            public void onPause() {
                if (listener != null) listener.onPause();
            }

            @Override
            public void onSkipToNext() {
                if (listener != null) listener.onNext();
            }

            @Override
            public void onSkipToPrevious() {
                if (listener != null) listener.onPrevious();
            }

            @Override
            public void onSeekTo(long pos) {
                if (listener != null) listener.onSeekTo(pos);
            }
        });

        mediaSession.setActive(true);
    }

    public void setNotificationListener(NotificationListener listener) {
        this.listener = listener;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && intent.getAction() != null) {
            String action = intent.getAction();
            switch (action) {
                case ACTION_PLAY:
                    if (listener != null) listener.onPlay();
                    break;
                case ACTION_PAUSE:
                    if (listener != null) listener.onPause();
                    break;
                case ACTION_NEXT:
                    if (listener != null) listener.onNext();
                    break;
                case ACTION_PREVIOUS:
                    if (listener != null) listener.onPrevious();
                    break;
                case ACTION_STOP:
                    stopSelf();
                    break;
            }
        }
        return START_NOT_STICKY;
    }

    public void updateNotification(String title, String artist, String album, String coverUrl, boolean playing, long positionMs, long durationMs) {
        this.currentTitle = title != null ? title : "VISA MUSIC";
        this.currentArtist = artist != null ? artist : "";
        this.currentAlbum = album != null ? album : "";
        this.isPlaying = playing;
        this.currentPositionMs = positionMs;
        this.currentDurationMs = durationMs;

        if (coverUrl != null && !coverUrl.equals(this.currentCoverUrl)) {
            this.currentCoverUrl = coverUrl;
            fetchBitmapAndNotify(coverUrl);
        } else {
            showNotification(currentCoverBitmap);
        }
    }

    private void fetchBitmapAndNotify(String urlString) {
        imageExecutor.execute(() -> {
            Bitmap bitmap = null;
            try {
                URL url = new URL(urlString);
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setDoInput(true);
                connection.connect();
                InputStream input = connection.getInputStream();
                bitmap = BitmapFactory.decodeStream(input);
            } catch (Exception e) {
                e.printStackTrace();
            }
            final Bitmap finalBitmap = bitmap;
            currentCoverBitmap = finalBitmap;
            showNotification(finalBitmap);
        });
    }

    public void showNotification(@Nullable Bitmap albumArt) {
        int state = isPlaying ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED;
        mediaSession.setPlaybackState(new PlaybackStateCompat.Builder()
                .setActions(PlaybackStateCompat.ACTION_PLAY |
                            PlaybackStateCompat.ACTION_PAUSE |
                            PlaybackStateCompat.ACTION_SKIP_TO_NEXT |
                            PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS |
                            PlaybackStateCompat.ACTION_SEEK_TO)
                .setState(state, currentPositionMs, isPlaying ? 1.0f : 0.0f)
                .build());

        MediaMetadataCompat.Builder metaBuilder = new MediaMetadataCompat.Builder()
                .putString(MediaMetadataCompat.METADATA_KEY_TITLE, currentTitle)
                .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, currentArtist)
                .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, currentAlbum)
                .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, currentDurationMs);

        if (albumArt != null) {
            metaBuilder.putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, albumArt);
        }
        mediaSession.setMetadata(metaBuilder.build());

        Intent openAppIntent = new Intent(this, MainActivity.class);
        PendingIntent contentIntent = PendingIntent.getActivity(
                this, 0, openAppIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        PendingIntent prevIntent = PendingIntent.getService(
                this, 1, new Intent(this, MusicService.class).setAction(ACTION_PREVIOUS), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Intent playPauseActionIntent = new Intent(this, MusicService.class)
                .setAction(isPlaying ? ACTION_PAUSE : ACTION_PLAY);
        PendingIntent playPauseIntent = PendingIntent.getService(
                this, 2, playPauseActionIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        PendingIntent nextIntent = PendingIntent.getService(
                this, 3, new Intent(this, MusicService.class).setAction(ACTION_NEXT), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        int playPauseIcon = isPlaying ? R.drawable.ic_pause : R.drawable.ic_play;
        String playPauseTitle = isPlaying ? "Pause" : "Play";

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_music_note)
                .setContentTitle(currentTitle)
                .setContentText(currentArtist)
                .setSubText(currentAlbum)
                .setLargeIcon(albumArt)
                .setContentIntent(contentIntent)
                .setDeleteIntent(PendingIntent.getService(
                        this, 4, new Intent(this, MusicService.class).setAction(ACTION_STOP), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                ))
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setOngoing(isPlaying)
                .addAction(R.drawable.ic_skip_previous, "Previous", prevIntent)
                .addAction(playPauseIcon, playPauseTitle, playPauseIntent)
                .addAction(R.drawable.ic_skip_next, "Next", nextIntent)
                .setStyle(new MediaStyle()
                        .setMediaSession(mediaSession.getSessionToken())
                        .setShowActionsInCompactView(0, 1, 2));

        Notification notification = builder.build();
        startForeground(NOTIFICATION_ID, notification);
    }

    public void dismissNotification() {
        if (mediaSession != null) {
            mediaSession.setActive(false);
        }
        stopForeground(STOP_FOREGROUND_REMOVE);
        stopSelf();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return binder;
    }

    @Override
    public void onDestroy() {
        if (mediaSession != null) {
            mediaSession.release();
        }
        imageExecutor.shutdown();
        super.onDestroy();
    }
}
