// Configuration des pizzerias avec leurs menus
const pizzaStores = [
    { 
        name: "PizzaExpress Centre-Ville",
        lat: 48.8566,
        lng: 2.3522,
        menu: ["margherita", "pepperoni", "quatre-fromages", "vegetarienne"]
    },
    { 
        name: "PizzaExpress Nord",
        lat: 48.8744,
        lng: 2.3526,
        menu: ["margherita", "diavola", "mexicaine", "poulet-bbq"]
    },
    { 
        name: "PizzaExpress Sud",
        lat: 48.8466,
        lng: 2.3518,
        menu: ["margherita", "fruits-de-mer", "quatre-fromages", "vegetarienne"]
    }
];

let map;
let userMarker;
let storeMarkers = [];

// Initialiser la carte
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: { lat: 48.8566, lng: 2.3522 } // Paris
    });
}

// Fonctionnalité de filtrage des pizzas
document.querySelectorAll('.nav-btn').forEach(button => {
    button.addEventListener('click', function() {
        if (this.classList.contains('custom-btn')) {
            showPizzaPersonalizer();
            return;
        }

        // Mettre à jour le bouton actif
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');

        const category = this.dataset.category;
        filterPizzas(category);
    });
});

function filterPizzas(category) {
    const pizzaCards = document.querySelectorAll('.pizza-card');
    pizzaCards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Fonctionnalité de personnalisation de pizza
function showPizzaPersonalizer() {
    document.querySelector('.pizza-selection').style.display = 'none';
    document.querySelector('.pizza-personalizer').style.display = 'block';
}

// Calculer le prix de la pizza personnalisée
function calculatePrice() {
    let basePrice = 10.99;
    const size = document.getElementById('pizza-size').value;
    const crust = document.getElementById('pizza-crust').value;
    
    // Ajustements selon la taille
    if (size === 'medium') basePrice += 2;
    if (size === 'large') basePrice += 4;
    if (size === 'xl') basePrice += 6;
    
    // Ajustement selon la pâte
    if (crust === 'stuffed') basePrice += 3;
    
    // Compter les garnitures sélectionnées
    const toppingsCount = document.querySelectorAll('.topping-item input:checked').length;
    basePrice += toppingsCount * 1.50;
    
    document.getElementById('total-price').textContent = `${basePrice.toFixed(2)} €`;
    return basePrice;
}

// Ajouter les écouteurs d'événements pour le calcul du prix
document.getElementById('pizza-size').addEventListener('change', calculatePrice);
document.getElementById('pizza-crust').addEventListener('change', calculatePrice);
document.querySelectorAll('.topping-item input').forEach(input => {
    input.addEventListener('change', calculatePrice);
});

// Gérer la commande de pizza personnalisée
document.querySelector('.create-pizza-btn').addEventListener('click', function() {
    const customPizza = {
        size: document.getElementById('pizza-size').value,
        crust: document.getElementById('pizza-crust').value,
        sauce: document.getElementById('pizza-sauce').value,
        toppings: Array.from(document.querySelectorAll('.topping-item input:checked')).map(input => input.value),
        price: calculatePrice()
    };
    showDeliveryForm(customPizza);
});

// Gérer la sélection des pizzas prédéfinies
document.querySelectorAll('.select-btn').forEach(button => {
    button.addEventListener('click', function() {
        const pizzaCard = this.closest('.pizza-card');
        const pizzaType = pizzaCard.dataset.pizza;
        const price = pizzaCard.querySelector('.price').textContent;
        
        const selectedPizza = {
            type: pizzaType,
            price: price
        };
        showDeliveryForm(selectedPizza);
    });
});

// Trouver les pizzerias les plus proches via Google Places
function findNearestStore(userLocation, pizzaDetails) {
    return new Promise((resolve, reject) => {
        const service = new google.maps.places.PlacesService(map);
        
        const request = {
            location: new google.maps.LatLng(userLocation.lat, userLocation.lng),
            radius: '5000', // Recherche dans un rayon de 5km
            type: ['restaurant'],
            keyword: 'pizzeria'
        };

        service.nearbySearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                // Obtenir plus de détails sur le premier résultat
                const nearestPlace = results[0];
                service.getDetails({
                    placeId: nearestPlace.place_id,
                    fields: ['name', 'formatted_address', 'formatted_phone_number', 'rating', 'opening_hours']
                }, (place, detailStatus) => {
                    if (detailStatus === google.maps.places.PlacesServiceStatus.OK) {
                        resolve({
                            name: place.name,
                            address: place.formatted_address,
                            phone: place.formatted_phone_number,
                            rating: place.rating,
                            isOpen: place.opening_hours ? place.opening_hours.isOpen() : null,
                            location: nearestPlace.geometry.location,
                            distance: google.maps.geometry.spherical.computeDistanceBetween(
                                new google.maps.LatLng(userLocation.lat, userLocation.lng),
                                nearestPlace.geometry.location
                            )
                        });
                    } else {
                        reject(new Error('Erreur lors de la récupération des détails de la pizzeria'));
                    }
                });
            } else {
                reject(new Error('Aucune pizzeria trouvée à proximité'));
            }
        });
    });
}

// Afficher la carte avec les marqueurs
function showStoresOnMap(userLocation, nearestStore) {
    // Centrer la carte sur l'utilisateur
    map.setCenter(userLocation);

    // Ajouter le marqueur de l'utilisateur
    if (userMarker) userMarker.setMap(null);
    userMarker = new google.maps.Marker({
        position: userLocation,
        map: map,
        title: 'Votre position',
        icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
    });

    // Supprimer les anciens marqueurs de magasins
    storeMarkers.forEach(marker => marker.setMap(null));
    storeMarkers = [];

    // Ajouter les marqueurs des magasins
    pizzaStores.forEach(store => {
        const isNearest = nearestStore && store.name === nearestStore.name;
        const marker = new google.maps.Marker({
            position: { lat: store.lat, lng: store.lng },
            map: map,
            title: store.name,
            icon: isNearest ? 
                'http://maps.google.com/mapfiles/ms/icons/green-dot.png' : 
                'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
        });
        storeMarkers.push(marker);
    });
}

// Mettre à jour la fonction showDeliveryForm
function showDeliveryForm(pizzaDetails) {
    document.querySelector('.pizza-selection').style.display = 'none';
    document.querySelector('.pizza-personalizer').style.display = 'none';
    document.querySelector('.delivery-section').style.display = 'block';
    document.getElementById('map').style.display = 'block';

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async position => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                try {
                    const nearestStore = await findNearestStore(userLocation, pizzaDetails);
                    displayStoreInfo(nearestStore, pizzaDetails);
                    showStoresOnMap(userLocation, nearestStore);
                } catch (error) {
                    console.error('Erreur:', error);
                    alert(error.message);
                    document.querySelector('.pizza-selection').style.display = 'block';
                    document.querySelector('.delivery-section').style.display = 'none';
                }
            },
            error => {
                console.error('Erreur de géolocalisation:', error);
                alert('Erreur de géolocalisation. Veuillez activer la localisation.');
            }
        );
    } else {
        alert('Votre navigateur ne supporte pas la géolocalisation.');
    }
}

// Mettre à jour la fonction displayStoreInfo
function displayStoreInfo(store, pizzaDetails) {
    const storeInfo = document.getElementById('store-info');
    if (!storeInfo || !store) return;

    const distance = (store.distance / 1000).toFixed(1); // Convertir en km
    const isOpenText = store.isOpen === null ? '' : 
                      store.isOpen ? '(Ouvert)' : '(Fermé)';
    const ratingStars = '⭐'.repeat(Math.round(store.rating));

    storeInfo.innerHTML = `
        <h3>${store.name} ${isOpenText}</h3>
        <p>
            ${ratingStars} (${store.rating})<br>
            Adresse : ${store.address}<br>
            Téléphone : ${store.phone || 'Non disponible'}<br>
            Distance : ${distance} km<br>
            ${pizzaDetails.type ? 
                `Pizza sélectionnée : ${getPizzaName(pizzaDetails.type)}<br>` : 
                `Pizza personnalisée (${getSizeName(pizzaDetails.size)}, ${getCrustName(pizzaDetails.crust)})<br>
                 Garnitures : ${pizzaDetails.toppings ? pizzaDetails.toppings.map(topping => getToppingName(topping)).join(', ') : 'Aucune'}<br>`
            }
            Prix estimé : ${typeof pizzaDetails.price === 'number' ? pizzaDetails.price.toFixed(2) : pizzaDetails.price} €
        </p>
    `;
}

// Fonctions de traduction des valeurs en français
function getPizzaName(type) {
    const pizzaNames = {
        'margherita': 'Margherita',
        'pepperoni': 'Pepperoni',
        'fruits-de-mer': 'Fruits de Mer',
        'poulet-bbq': 'Poulet BBQ',
        'vegetarienne': 'Jardinière',
        'quatre-fromages': 'Quatre Fromages',
        'diavola': 'Diavola',
        'mexicaine': 'Mexicaine'
    };
    return pizzaNames[type] || type;
}

function getSizeName(size) {
    const sizes = {
        'small': 'Petite (25cm)',
        'medium': 'Moyenne (30cm)',
        'large': 'Grande (35cm)',
        'xl': 'Extra Large (40cm)'
    };
    return sizes[size] || size;
}

function getCrustName(crust) {
    const crusts = {
        'thin': 'Pâte Fine',
        'regular': 'Pâte Classique',
        'thick': 'Pâte Épaisse',
        'stuffed': 'Pâte Fourrée'
    };
    return crusts[crust] || crust;
}

function getToppingName(topping) {
    const toppings = {
        'pepperoni': 'Pepperoni',
        'champignons': 'Champignons',
        'oignons': 'Oignons',
        'saucisse': 'Saucisse',
        'bacon': 'Bacon',
        'fromage-supp': 'Fromage Supplémentaire',
        'poivrons': 'Poivrons',
        'olives': 'Olives'
    };
    return toppings[topping] || topping;
}

// Images pour les ingrédients
const INGREDIENT_IMAGES = {
    sauce_tomate: '#FF6B6B',
    sauce_bbq: '#8B4513',
    sauce_cremeFraiche: '#FFF5EE',
    champignons: '/images/mushrooms.png',
    pepperoni: '/images/pepperoni.png',
    fromage: '/images/cheese.png',
    oignons: '/images/onions.png',
    poivrons: '/images/peppers.png',
    olives: '/images/olives.png'
};

// Configuration de la pizza
const PIZZA_CONFIG = {
    sizes: {
        small: 0.6,
        medium: 0.75,
        large: 0.85,
        xl: 0.95
    },
    crusts: {
        thin: { color: '#FFE0B2', height: 10 },
        regular: { color: '#FFD180', height: 15 },
        thick: { color: '#FFCC80', height: 20 },
        stuffed: { color: '#FFB74D', height: 25 }
    },
    sauces: {
        tomato: '#FF6B6B',
        bbq: '#8B4513',
        white: '#E6E6DC',
        pesto: '#228B22'
    }
};

let canvas, ctx;
let currentPizza = {
    size: 'medium',
    crust: 'regular',
    sauce: 'tomato',
    toppings: []
};

// Initialisation du canvas
function initPizzaVisualizer() {
    canvas = document.getElementById('pizzaCanvas');
    ctx = canvas.getContext('2d');
    
    // Événements pour les sélecteurs
    document.getElementById('pizza-size').addEventListener('change', (e) => {
        currentPizza.size = e.target.value;
        drawPizza();
    });
    
    document.getElementById('pizza-crust').addEventListener('change', (e) => {
        currentPizza.crust = e.target.value;
        drawPizza();
    });
    
    document.getElementById('pizza-sauce').addEventListener('change', (e) => {
        currentPizza.sauce = e.target.value;
        drawPizza();
    });
    
    // Événements pour les toppings
    document.querySelectorAll('.topping-item input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                currentPizza.toppings.push(e.target.value);
            } else {
                currentPizza.toppings = currentPizza.toppings.filter(t => t !== e.target.value);
            }
            drawPizza();
        });
    });
    
    // Dessiner la pizza initiale
    drawPizza();
}

// Fonction pour dessiner la pizza
function drawPizza() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseRadius = Math.min(canvas.width, canvas.height) * 0.35;
    const radius = baseRadius * PIZZA_CONFIG.sizes[currentPizza.size];
    
    // Dessiner la croûte
    const crustConfig = PIZZA_CONFIG.crusts[currentPizza.crust];
    
    // Dessiner le fond de la pizza
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFF0DB';
    ctx.fill();
    
    // Ajouter une ombre subtile pour la sauce
    if (currentPizza.sauce === 'white') {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fill();
    }
    
    // Dessiner la sauce
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 5, 0, Math.PI * 2);
    ctx.fillStyle = PIZZA_CONFIG.sauces[currentPizza.sauce];
    ctx.fill();
    
    // Dessiner le bord de la croûte
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.lineWidth = crustConfig.height;
    ctx.strokeStyle = crustConfig.color;
    ctx.stroke();
    
    // Dessiner les garnitures
    const toppingRadius = radius - crustConfig.height;
    currentPizza.toppings.forEach(topping => {
        // Nombre de garnitures basé sur la taille de la pizza
        const numToppings = Math.floor(15 * PIZZA_CONFIG.sizes[currentPizza.size]);
        
        for (let i = 0; i < numToppings; i++) {
            const angle = (Math.PI * 2 * i) / numToppings + (Math.random() * 0.5);
            const distance = Math.random() * (toppingRadius * 0.8);
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            
            drawTopping(topping, x, y);
        }
    });
}

// Fonction pour dessiner une garniture spécifique
function drawTopping(topping, x, y) {
    switch(topping) {
        case 'pepperoni':
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fill();
            break;
            
        case 'champignons':
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#A0522D';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
            break;
            
        // ... autres garnitures ...
    }
}

initPizzaVisualizer();
