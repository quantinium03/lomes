package main

import (
    "log"
    "net/http"
    "os"
    "os/exec"
    "path/filepath"
)

func startFFmpeg() error {
    cmd := exec.Command("ffmpeg",
        "-re", "-i", "./media/input.mp4",
        "-c:v", "h264_nvenc", "-preset", "fast", "-b:v", "2500k",
        "-c:a", "aac", "-b:a", "128k",
        "-f", "hls", "-hls_time", "4", "-hls_list_size", "0",
        "-hls_flags", "delete_segments",
        "-hls_segment_filename", "./hls/segment_%03d.ts", "./hls/stream.m3u8")

    cmd.Stdout = os.Stdout
    cmd.Stderr = os.Stderr
    return cmd.Start()
}

func ServeHLS(w http.ResponseWriter, r *http.Request) {
    ext := filepath.Ext(r.URL.Path)
    if ext == ".m3u8" {
        w.Header().Set("Content-Type", "application/vnd.apple.mpegurl")
    } else if ext == ".ts" {
        w.Header().Set("Content-Type", "video/mp2t")
    }

    // Serve the file
    http.ServeFile(w, r, "./hls"+r.URL.Path)
}

func main() {
    os.Mkdir("./hls", 0755)
    if err := startFFmpeg(); err != nil {
        log.Fatalf("Error starting FFmpeg: %v", err)
    }
    http.HandleFunc("/", ServeHLS)
    port := ":8000"
    log.Println("Serving on port", port)
    log.Fatal(http.ListenAndServe(port, nil))
}

