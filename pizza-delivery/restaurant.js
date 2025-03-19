class Table {
    constructor(number) {
        this.number = number;
        this.customers = 0;
        this.order = null;
        this.status = 'free'; // free, ordered, eating, paid
        this.orderPaid = false;
    }
}

class Restaurant {
    constructor(numberOfTables = 10) {
        this.tables = new Array(numberOfTables).fill(null)
            .map((_, index) => new Table(index + 1));
    }

    // Asseoir des clients à une table
    seatCustomers(tableNumber, numberOfCustomers) {
        const table = this.tables[tableNumber - 1];
        if (table.status !== 'free') {
            throw new Error('La table n\'est pas disponible');
        }
        table.customers = numberOfCustomers;
        table.status = 'seated';
    }

    // Passer une commande pour une table
    placeOrder(tableNumber, order) {
        const table = this.tables[tableNumber - 1];
        if (table.status !== 'seated') {
            throw new Error('La table n\'est pas occupée ou a déjà commandé');
        }
        table.order = order;
        table.status = 'ordered';
    }

    // Marquer la commande comme payée
    markOrderAsPaid(tableNumber) {
        const table = this.tables[tableNumber - 1];
        if (table.status !== 'ordered' && table.status !== 'eating') {
            throw new Error('La table n\'a pas de commande active');
        }
        table.orderPaid = true;
    }

    // Servir la commande à la table
    serveOrder(tableNumber) {
        const table = this.tables[tableNumber - 1];
        if (table.status !== 'ordered') {
            throw new Error('La table n\'a pas de commande en attente');
        }
        table.status = 'eating';
    }

    // Libérer la table
    clearTable(tableNumber) {
        const table = this.tables[tableNumber - 1];
        if (!table.orderPaid) {
            throw new Error('La commande n\'a pas été payée');
        }
        table.customers = 0;
        table.order = null;
        table.status = 'free';
        table.orderPaid = false;
    }

    // Obtenir l'état de toutes les tables
    getTablesStatus() {
        return this.tables.map(table => ({
            number: table.number,
            customers: table.customers,
            status: table.status,
            orderPaid: table.orderPaid,
            order: table.order
        }));
    }
}

// Créer l'instance du restaurant
const restaurant = new Restaurant();

// Exporter l'instance du restaurant
export { restaurant, Restaurant, Table };
