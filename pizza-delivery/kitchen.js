// Configuration de la pizza (copié depuis script.js)
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

// État global des commandes
let orders = {
    pending: [],
    preparing: [],
    completed: []
};

// Fonction pour récupérer toutes les commandes depuis l'API
async function fetchOrders() {
    try {
        const response = await fetch('http://localhost:3000/api/orders');
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des commandes');
        }
        
        const allOrders = await response.json();
        
        // Réinitialiser les tableaux
        orders.pending = [];
        orders.preparing = [];
        orders.completed = [];
        
        // Trier les commandes par statut
        allOrders.forEach(order => {
            switch(order.status) {
                case 'pending':
                    orders.pending.push(order);
                    break;
                case 'preparing':
                    orders.preparing.push(order);
                    break;
                case 'completed':
                    orders.completed.push(order);
                    break;
            }
        });
        
        updateOrders();
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la récupération des commandes: ' + error.message);
    }
}

// Fonction pour mettre à jour le statut d'une commande via l'API
async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`http://localhost:3000/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la mise à jour du statut');
        }

        // Récupérer les commandes mises à jour
        await fetchOrders();
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la mise à jour du statut: ' + error.message);
    }
}

// Fonction pour mettre à jour les compteurs
function updateCounters() {
    document.getElementById('pending-orders').textContent = orders.pending.length;
    document.getElementById('preparing-orders').textContent = orders.preparing.length;
    document.getElementById('completed-orders').textContent = orders.completed.length;
}

// Fonction pour créer une carte de commande
function createOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'order-card';
    card.innerHTML = `
        <div class="order-header">
            <span class="order-number">Commande #${order.id}</span>
            <span class="order-time">${new Date(order.timestamp).toLocaleTimeString()}</span>
        </div>
        <div class="order-items">
            <strong>Client:</strong> ${order.customerName}<br>
            <strong>Pizza:</strong> ${getSizeText(order.size)}, ${getCrustText(order.crust)}
        </div>
        <span class="order-status status-${order.status}">${getStatusText(order.status)}</span>
    `;
    
    card.addEventListener('click', () => showOrderDetails(order));
    return card;
}

// Fonction pour afficher le texte du statut
function getStatusText(status) {
    switch(status) {
        case 'pending': return 'En attente';
        case 'preparing': return 'En préparation';
        case 'completed': return 'Terminée';
        default: return status;
    }
}

// Fonction pour afficher les détails d'une commande
function showOrderDetails(order) {
    const modal = document.getElementById('order-details-modal');
    const content = document.getElementById('order-details-content');
    const canvas = document.getElementById('pizzaPreviewCanvas');
    
    content.innerHTML = `
        <h3>Commande #${order.id}</h3>
        <p><strong>Heure de commande:</strong> ${new Date(order.timestamp).toLocaleString()}</p>
        <p><strong>Client:</strong> ${order.customerName}</p>
        <p><strong>Téléphone:</strong> ${order.phone}</p>
        <p><strong>Adresse:</strong> ${order.address}</p>
        <h4>Détails de la Pizza:</h4>
        <ul>
            <li>Taille: ${getSizeText(order.size)}</li>
            <li>Pâte: ${getCrustText(order.crust)}</li>
            <li>Sauce: ${getSauceText(order.sauce)}</li>
            <li>Garnitures: ${order.toppings.map(t => getToppingText(t)).join(', ') || 'Aucune'}</li>
        </ul>
        ${order.specialInstructions ? `<p><strong>Instructions spéciales:</strong> ${order.specialInstructions}</p>` : ''}
    `;
    
    // Afficher la prévisualisation de la pizza
    drawPizzaPreview(canvas, order);
    
    // Configurer les boutons d'action
    const startPrepBtn = modal.querySelector('.start-prep-btn');
    const completeBtn = modal.querySelector('.complete-btn');
    
    startPrepBtn.style.display = order.status === 'pending' ? 'block' : 'none';
    completeBtn.style.display = order.status === 'preparing' ? 'block' : 'none';
    
    startPrepBtn.onclick = () => {
        updateOrderStatus(order.id, 'preparing');
        modal.style.display = 'none';
    };
    
    completeBtn.onclick = () => {
        updateOrderStatus(order.id, 'completed');
        modal.style.display = 'none';
    };
    
    modal.style.display = 'block';
    
    // Fermeture du modal
    modal.querySelector('.close').onclick = () => modal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target === modal) modal.style.display = 'none';
    };
}

// Fonctions de traduction
function getSizeText(size) {
    const sizes = {
        small: 'Petite',
        medium: 'Moyenne',
        large: 'Grande',
        xl: 'Extra Large'
    };
    return sizes[size] || size;
}

function getCrustText(crust) {
    const crusts = {
        thin: 'Fine',
        regular: 'Classique',
        thick: 'Épaisse',
        stuffed: 'Fourrée'
    };
    return crusts[crust] || crust;
}

function getSauceText(sauce) {
    const sauces = {
        tomato: 'Tomate',
        bbq: 'Barbecue',
        white: 'Crème',
        pesto: 'Pesto'
    };
    return sauces[sauce] || sauce;
}

function getToppingText(topping) {
    const toppings = {
        pepperoni: 'Pepperoni',
        mushrooms: 'Champignons',
        cheese: 'Fromage',
        onions: 'Oignons',
        peppers: 'Poivrons',
        olives: 'Olives'
    };
    return toppings[topping] || topping;
}

// Fonction pour mettre à jour l'affichage des commandes
function updateOrders() {
    document.querySelector('#pending-orders-list .orders-list').innerHTML = '';
    document.querySelector('#preparing-orders-list .orders-list').innerHTML = '';
    document.querySelector('#completed-orders-list .orders-list').innerHTML = '';
    
    orders.pending.forEach(order => {
        document.querySelector('#pending-orders-list .orders-list')
            .appendChild(createOrderCard(order));
    });
    
    orders.preparing.forEach(order => {
        document.querySelector('#preparing-orders-list .orders-list')
            .appendChild(createOrderCard(order));
    });
    
    orders.completed.forEach(order => {
        document.querySelector('#completed-orders-list .orders-list')
            .appendChild(createOrderCard(order));
    });
    
    updateCounters();
}

// Fonction pour dessiner la prévisualisation de la pizza
function drawPizzaPreview(canvas, order) {
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseRadius = Math.min(canvas.width, canvas.height) * 0.35;
    const radius = baseRadius * PIZZA_CONFIG.sizes[order.size];
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dessiner la croûte
    const crustConfig = PIZZA_CONFIG.crusts[order.crust];
    
    // Fond de la pizza
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFF0DB';
    ctx.fill();
    
    // Sauce
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 5, 0, Math.PI * 2);
    ctx.fillStyle = PIZZA_CONFIG.sauces[order.sauce];
    ctx.fill();
    
    // Bord de la croûte
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.lineWidth = crustConfig.height;
    ctx.strokeStyle = crustConfig.color;
    ctx.stroke();
    
    // Garnitures
    order.toppings.forEach(topping => drawToppings(ctx, centerX, centerY, radius - crustConfig.height, topping));
}

// Fonction pour dessiner les garnitures
function drawToppings(ctx, centerX, centerY, radius, topping) {
    const numToppings = 12;
    for (let i = 0; i < numToppings; i++) {
        const angle = (Math.PI * 2 * i) / numToppings;
        const distance = radius * 0.6;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        
        switch(topping) {
            case 'pepperoni':
                ctx.fillStyle = '#FF0000';
                ctx.beginPath();
                ctx.arc(x, y, 8, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'mushrooms':
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(x, y, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#A0522D';
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            // Ajouter d'autres garnitures ici selon les besoins
        }
    }
}

// Rafraîchir les commandes toutes les 30 secondes
function startOrdersRefresh() {
    fetchOrders(); // Première récupération
    setInterval(fetchOrders, 30000); // Rafraîchir toutes les 30 secondes
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    startOrdersRefresh();
});
