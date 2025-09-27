document.addEventListener('DOMContentLoaded', () => {
    // --- Video Playlist Logic ---
    const videoPlayer = document.getElementById('background-video');
    const videoSource = document.getElementById('video-source');

    const videoPlaylist = [
        'videos/background1.mp4',
        'videos/background2.mp4',
        'videos/background3.mp4',
        'videos/background4.mp4'
    ];

    let currentVideoIndex = 0;

    function playNextVideo() {
        let nextVideoIndex;
        do {
            nextVideoIndex = Math.floor(Math.random() * videoPlaylist.length);
        } while (nextVideoIndex === currentVideoIndex);

        currentVideoIndex = nextVideoIndex;
        const nextVideo = videoPlaylist[currentVideoIndex];

        videoSource.src = nextVideo;
        videoPlayer.load();
        videoPlayer.play();
    }

    if (videoPlayer) {
        videoPlayer.addEventListener('ended', playNextVideo);
    }

    // --- Initialize the rest of the app ---
    displayGenreFilters();
    showMessage('Search for a movie or select a genre to begin!');
});


/*
 * script.js
 * This file contains the JavaScript for fetching and displaying movie data from the OMDB API.
 */

// API constants
const API_KEY = 'f1f8e0b2'; // <-- IMPORTANT: REPLACE WITH YOUR KEY
const BASE_URL = 'https://www.omdbapi.com/';
const DEFAULT_POSTER_URL = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'450\' viewBox=\'0 0 300 450\'%3E%3Crect fill=\'%232b2b45\' width=\'300\' height=\'450\'/%3E%3Ctext fill=\'%23888\' font-family=\'sans-serif\' font-size=\'18px\' dy=\'10.5\' font-weight=\'bold\' x=\'50%25\' y=\'50%25\' text-anchor=\'middle\'%3ENo Poster Available%3C/text%3E%3C/svg%3E';

// Get references to DOM elements
const movieGrid = document.getElementById('movie-grid');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const mainView = document.getElementById('main-view');
const detailsView = document.getElementById('details-view');
const loader = document.getElementById('loader');
const message = document.getElementById('message');
const genreFilters = document.getElementById('genre-filters');
const paginationContainer = document.getElementById('pagination');
const prevPageButton = document.getElementById('prev-page');
const nextPageButton = document.getElementById('next-page');

// Global state variables
let currentPage = 1;
let lastSearchTerm = '';
let totalResults = 0;

const genres = [
    'Action', 'Comedy', 'Sci-Fi', 'Horror', 'Thriller', 'Animation', 'Fantasy', 'Family'
];

async function fetchMovies(searchTerm, page) {
    try {
        const response = await fetch(`${BASE_URL}?apikey=${API_KEY}&s=${searchTerm}&page=${page}`);
        const data = await response.json();
        if (data.Response === 'True') {
            return { movies: data.Search, totalResults: parseInt(data.totalResults, 10) };
        } else {
            return { error: data.Error };
        }
    } catch (error) {
        console.error('Failed to fetch movies:', error);
        return { error: 'Network error. Please try again.' };
    }
}

async function fetchMovieDetails(imdbID) {
    try {
        const response = await fetch(`${BASE_URL}?apikey=${API_KEY}&i=${imdbID}&plot=full`);
        const data = await response.json();
        return data.Response === 'True' ? data : null;
    } catch (error) {
        console.error('Failed to fetch movie details:', error);
        return null;
    }
}

function displayMovies(movies) {
    movieGrid.innerHTML = '';
    
    if (!movies || movies.length === 0) {
        showMessage('No movies found. Try another search!');
        movieGrid.style.display = 'none';
        return;
    }

    message.style.display = 'none';
    movieGrid.style.display = 'grid';

    movies.forEach(movie => {
        const { Title, Year, Poster, imdbID } = movie;
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');
        
        movieCard.innerHTML = `
            <img src="${Poster !== 'N/A' ? Poster : DEFAULT_POSTER_URL}" alt="${Title}" onerror="this.src='${DEFAULT_POSTER_URL}';">
            <div class="movie-info">
                <h3>${Title}</h3>
                <p>Year: ${Year || 'N/A'}</p>
            </div>
        `;
        
        movieCard.addEventListener('click', () => showMovieDetails(imdbID));
        movieGrid.appendChild(movieCard);
    });
}

async function showMovieDetails(imdbID) {
    mainView.classList.remove('active');
    detailsView.classList.add('active');

    detailsView.innerHTML = `<div class="loader" style="display: block; margin-top: 5rem;"><i class="fas fa-spinner fa-spin"></i></div>`;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const movie = await fetchMovieDetails(imdbID);

    if (movie) {
        const poster = movie.Poster !== 'N/A' ? movie.Poster : DEFAULT_POSTER_URL;
        detailsView.innerHTML = `
            <div class="details-container">
                <img src="${poster}" alt="${movie.Title}" onerror="this.src='${DEFAULT_POSTER_URL}';">
                <div class="details-content">
                    <h2>${movie.Title}</h2>
                    <p><strong>Rating:</strong> ${movie.imdbRating || 'N/A'}</p>
                    <p><strong>Released:</strong> ${movie.Released || 'N/A'}</p>
                    <p><strong>Runtime:</strong> ${movie.Runtime || 'N/A'}</p>
                    <p><strong>Director:</strong> ${movie.Director || 'N/A'}</p>
                    <p><strong>Genre:</strong> ${movie.Genre || 'N/A'}</p>
                    <p class="overview-title">Overview</p>
                    <p>${movie.Plot || 'No plot available.'}</p>
                    <button class="back-button">Back to Search</button>
                </div>
            </div>
        `;

        detailsView.querySelector('.back-button').addEventListener('click', () => {
            detailsView.classList.remove('active');
            mainView.classList.add('active');
        });
    } else {
        detailsView.innerHTML = `
            <p class="message">Could not retrieve movie details.</p>
            <button class="back-button">Back to Search</button>
        `;
        detailsView.querySelector('.back-button').addEventListener('click', () => {
            detailsView.classList.remove('active');
            mainView.classList.add('active');
        });
    }
}

function updatePagination() {
    if (totalResults > 10) {
        paginationContainer.style.display = 'flex';
    } else {
        paginationContainer.style.display = 'none';
    }
    
    prevPageButton.disabled = currentPage <= 1;
    
    const totalPages = Math.ceil(totalResults / 10);
    nextPageButton.disabled = currentPage >= totalPages;
}

function displayGenreFilters() {
    genreFilters.innerHTML = '';
    
    genres.forEach(genre => {
        const button = document.createElement('button');
        button.classList.add('genre-button');
        button.textContent = genre;
        button.addEventListener('click', () => {
            document.querySelectorAll('.genre-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            searchInput.value = genre;
            handleSearch(null, genre);
        });
        genreFilters.appendChild(button);
    });
}

function showMessage(text) {
    movieGrid.innerHTML = '';
    movieGrid.style.display = 'none';
    message.style.display = 'block';
    message.innerHTML = `<p>${text}</p>`;
    paginationContainer.style.display = 'none';
}

async function handleSearch(e, genreTerm) {
    if (e) e.preventDefault();
    
    const searchTerm = genreTerm || searchInput.value.trim();
    
    if (searchTerm !== lastSearchTerm) {
        currentPage = 1;
    }
    lastSearchTerm = searchTerm;
    
    detailsView.classList.remove('active');
    mainView.classList.add('active');

    if (!searchTerm) {
        showMessage('Please enter a movie title to search.');
        return;
    }
    
    loader.style.display = 'block';
    movieGrid.style.display = 'none';
    message.style.display = 'none';
    paginationContainer.style.display = 'none';

    const result = await fetchMovies(searchTerm, currentPage);
    
    loader.style.display = 'none';

    if (result.error) {
        showMessage(result.error);
    } else {
        totalResults = result.totalResults;
        displayMovies(result.movies);
        updatePagination();
    }
}

// === Event Listeners ===

searchForm.addEventListener('submit', handleSearch);

prevPageButton.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        handleSearch(null, lastSearchTerm);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

nextPageButton.addEventListener('click', () => {
    const totalPages = Math.ceil(totalResults / 10);
    if (currentPage < totalPages) {
        currentPage++;
        handleSearch(null, lastSearchTerm);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});