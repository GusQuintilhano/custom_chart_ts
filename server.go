package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
)

const (
	headerContentType = "Content-Type"
	contentTypeJSON   = "application/json"
)

type HealthResponse struct {
	Status    string   `json:"status"`
	Charts    []string `json:"charts"`
	Timestamp string   `json:"timestamp"`
	Version   string   `json:"version"`
}

type RootResponse struct {
	Message string            `json:"message"`
	Charts  map[string]string `json:"charts"`
	Status  string            `json:"status"`
}

type ChartResponse struct {
	Chart   string `json:"chart"`
	Status  string `json:"status"`
	Message string `json:"message"`
}

func writeJSON(w http.ResponseWriter, v interface{}) {
	w.Header().Set(headerContentType, contentTypeJSON)
	json.NewEncoder(w).Encode(v)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, HealthResponse{
		Status:    "ok",
		Charts:    []string{"trellis", "boxplot"},
		Timestamp: time.Now().Format(time.RFC3339),
		Version:   "1.0.0",
	})
}

func rootHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, RootResponse{
		Message: "Charts Router - ThoughtSpot Custom Charts",
		Charts: map[string]string{
			"trellis": "/trellis",
			"boxplot": "/boxplot",
		},
		Status: "running",
	})
}

func trellisHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, ChartResponse{
		Chart:   "trellis",
		Status:  "available",
		Message: "Trellis chart endpoint",
	})
}

func boxplotHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, ChartResponse{
		Chart:   "boxplot",
		Status:  "available",
		Message: "Boxplot chart endpoint",
	})
}

func main() {
	http.HandleFunc("/health", healthHandler)
	http.HandleFunc("/", rootHandler)
	http.HandleFunc("/trellis", trellisHandler)
	http.HandleFunc("/boxplot", boxplotHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Charts router listening on port %s\n", port)
	fmt.Printf("Health: http://localhost:%s/health\n", port)

	log.Fatal(http.ListenAndServe(":"+port, nil))
}
