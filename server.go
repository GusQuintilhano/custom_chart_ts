package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

const (
	headerContentType = "Content-Type"
	contentTypeJSON   = "application/json"
	// staticDir é o diretório no container com trellis e boxplot (builds); usado para servir o HTML do chart ao ThoughtSpot
	staticDir = "/app/static"
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

// serveChartIndex entrega o index.html do chart para que o ThoughtSpot carregue a aplicação do gráfico (iframe).
func serveChartIndex(chartName string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/"+chartName {
			return
		}
		indexPath := filepath.Join(staticDir, chartName, "index.html")
		http.ServeFile(w, r, indexPath)
	}
}

func main() {
	// Arquivos estáticos dos charts (HTML/JS/CSS) para o ThoughtSpot carregar o gráfico
	trellisFS := http.Dir(filepath.Join(staticDir, "trellis"))
	boxplotFS := http.Dir(filepath.Join(staticDir, "boxplot"))
	http.Handle("/trellis/", http.StripPrefix("/trellis/", http.FileServer(trellisFS)))
	http.Handle("/boxplot/", http.StripPrefix("/boxplot/", http.FileServer(boxplotFS)))
	http.HandleFunc("/trellis", serveChartIndex("trellis"))
	http.HandleFunc("/boxplot", serveChartIndex("boxplot"))

	http.HandleFunc("/health", healthHandler)
	http.HandleFunc("/", rootHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Charts router listening on port %s\n", port)
	fmt.Printf("Health: http://localhost:%s/health\n", port)

	log.Fatal(http.ListenAndServe(":"+port, nil))
}
