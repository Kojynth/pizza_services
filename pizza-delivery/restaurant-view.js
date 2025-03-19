import { restaurant } from './restaurant.js';

class RestaurantEditor {
    constructor() {
        this.initializeEventListeners();
        this.initializeDragAndDrop();
        this.loadLayout();
    }

    initializeEventListeners() {
        const layoutArea = document.getElementById('layout-area');

        // Boutons
        document.getElementById('save-layout').addEventListener('click', () => {
            this.saveLayout();
            alert('Plan de salle sauvegardé !');
        });

        document.getElementById('clear-layout').addEventListener('click', () => {
            if (confirm('Voulez-vous vraiment effacer tout le plan ?')) {
                layoutArea.innerHTML = '';
                this.saveLayout();
            }
        });
    }

    initializeDragAndDrop() {
        // Rendre les éléments de la toolbox draggable
        interact('.tool-item').draggable({
            inertia: false,
            modifiers: [],
            autoScroll: true,
            listeners: {
                start: (event) => {
                    console.log('drag start');
                },
                move: (event) => {
                    console.log('drag move');
                },
                end: (event) => {
                    const layoutArea = document.getElementById('layout-area');
                    const rect = layoutArea.getBoundingClientRect();
                    const x = event.clientX - rect.left;
                    const y = event.clientY - rect.top;

                    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
                        this.createTable(event.target.dataset.type, x, y);
                    }
                }
            }
        });

        // Rendre la zone de layout droppable
        interact('#layout-area').dropzone({
            accept: '.tool-item',
            overlap: 0.75,
            ondropactivate: (event) => {
                event.target.classList.add('drop-active');
            },
            ondragenter: (event) => {
                event.target.classList.add('drop-target');
            },
            ondragleave: (event) => {
                event.target.classList.remove('drop-target');
            },
            ondrop: (event) => {
                const type = event.relatedTarget.dataset.type;
                const rect = event.target.getBoundingClientRect();
                const x = event.dragEvent.clientX - rect.left;
                const y = event.dragEvent.clientY - rect.top;
                this.createTable(type, x, y);
            },
            ondropdeactivate: (event) => {
                event.target.classList.remove('drop-active');
                event.target.classList.remove('drop-target');
            }
        });
    }

    createTable(type, x, y) {
        const table = document.createElement('div');
        table.className = `table ${type} free`;
        table.style.left = `${x}px`;
        table.style.top = `${y}px`;
        table.style.position = 'absolute';
        
        this.makeTableDraggable(table);
        document.getElementById('layout-area').appendChild(table);
        this.saveLayout();
    }

    makeTableDraggable(table) {
        interact(table).draggable({
            inertia: false,
            modifiers: [],
            autoScroll: true,
            listeners: {
                move: (event) => {
                    const target = event.target;
                    const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                    const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

                    target.style.transform = `translate(${x}px, ${y}px)`;
                    target.setAttribute('data-x', x);
                    target.setAttribute('data-y', y);
                },
                end: (event) => {
                    this.saveLayout();
                }
            }
        });

        table.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e, table);
        });
    }

    showContextMenu(e, element) {
        const menu = document.getElementById('context-menu');
        menu.style.display = 'block';
        menu.style.left = `${e.pageX}px`;
        menu.style.top = `${e.pageY}px`;

        const handleAction = (action) => {
            switch(action) {
                case 'rotate':
                    this.rotateElement(element);
                    break;
                case 'delete':
                    element.remove();
                    break;
                case 'status':
                    this.cycleTableStatus(element);
                    break;
            }
            menu.style.display = 'none';
            this.saveLayout();
        };

        menu.querySelectorAll('button').forEach(button => {
            button.onclick = () => handleAction(button.dataset.action);
        });

        document.addEventListener('click', () => {
            menu.style.display = 'none';
        }, { once: true });
    }

    rotateElement(element) {
        const currentRotation = element.style.transform || 'rotate(0deg)';
        const currentDegrees = parseInt(currentRotation.match(/\d+/) || 0);
        element.style.transform = `rotate(${(currentDegrees + 90) % 360}deg)`;
    }

    cycleTableStatus(element) {
        const statuses = ['free', 'occupied', 'ordered', 'served'];
        let currentIndex = statuses.findIndex(status => element.classList.contains(status));
        
        statuses.forEach(status => element.classList.remove(status));
        currentIndex = (currentIndex + 1) % statuses.length;
        element.classList.add(statuses[currentIndex]);
    }

    saveLayout() {
        const layout = {
            tables: Array.from(document.getElementById('layout-area').children).map(table => ({
                type: table.className.split(' ')[0],
                x: parseInt(table.style.left),
                y: parseInt(table.style.top),
                rotation: table.style.transform || 'rotate(0deg)',
                status: ['free', 'occupied', 'ordered', 'served'].find(status => 
                    table.classList.contains(status)
                )
            }))
        };
        localStorage.setItem('restaurantLayout', JSON.stringify(layout));
    }

    loadLayout() {
        const saved = localStorage.getItem('restaurantLayout');
        if (!saved) return;

        const layout = JSON.parse(saved);
        layout.tables.forEach(table => {
            const element = document.createElement('div');
            element.className = `${table.type} ${table.status}`;
            element.style.left = `${table.x}px`;
            element.style.top = `${table.y}px`;
            element.style.transform = table.rotation;
            
            this.makeTableDraggable(element);
            document.getElementById('layout-area').appendChild(element);
        });
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    new RestaurantEditor();
});
