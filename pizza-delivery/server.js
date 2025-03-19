const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Connexion à la base de données
const db = new sqlite3.Database('pizza.db', (err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données:', err);
    } else {
        console.log('Connecté à la base de données SQLite');
        initDatabase();
    }
});

// Initialisation de la base de données
function initDatabase() {
    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER,
        customerName TEXT,
        phone TEXT,
        address TEXT,
        size TEXT,
        crust TEXT,
        sauce TEXT,
        toppings TEXT,
        status TEXT,
        specialInstructions TEXT
    )`, (err) => {
        if (err) {
            console.error('Erreur lors de la création de la table:', err);
        } else {
            console.log('Table des commandes créée ou déjà existante');
        }
    });
}

// Routes API
// Récupérer toutes les commandes
app.get('/api/orders', (req, res) => {
    db.all('SELECT * FROM orders ORDER BY timestamp DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        rows.forEach(row => {
            row.toppings = JSON.parse(row.toppings);
        });
        res.json(rows);
    });
});

// Créer une nouvelle commande
app.post('/api/orders', (req, res) => {
    const {
        customerName,
        phone,
        address,
        size,
        crust,
        sauce,
        toppings,
        specialInstructions
    } = req.body;

    const sql = `INSERT INTO orders (
        timestamp,
        customerName,
        phone,
        address,
        size,
        crust,
        sauce,
        toppings,
        status,
        specialInstructions
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
        Date.now(),
        customerName,
        phone,
        address,
        size,
        crust,
        sauce,
        JSON.stringify(toppings),
        'pending',
        specialInstructions
    ];

    db.run(sql, values, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            id: this.lastID,
            message: 'Commande créée avec succès'
        });
    });
});

// Mettre à jour le statut d'une commande
app.put('/api/orders/:id/status', (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    db.run(
        'UPDATE orders SET status = ? WHERE id = ?',
        [status, id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            if (this.changes === 0) {
                res.status(404).json({ error: 'Commande non trouvée' });
                return;
            }
            res.json({ message: 'Statut mis à jour avec succès' });
        }
    );
});

// Démarrage du serveur
app.listen(port, () => {
    console.log(`Serveur démarré sur http://localhost:${port}`);
});
