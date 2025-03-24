from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO, emit
import stripe
import uuid

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
# Remplacez ceci par votre clé secrète Stripe de test
stripe.api_key = 'sk_test_votreclésecrete'
socketio = SocketIO(app)

# État global du restaurant
restaurant_state = {
    'furniture': [],
    'table_counter': 1,
    'orders': {}
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/create-payment-intent', methods=['POST'])
def create_payment():
    try:
        data = request.json
        table_number = data.get('table_number')
        
        # Créer un ID de commande unique
        order_id = str(uuid.uuid4())
        
        # Créer l'intention de paiement
        intent = stripe.PaymentIntent.create(
            amount=2000,  # Montant en centimes (20€)
            currency='eur',
            metadata={
                'order_id': order_id,
                'table_number': table_number
            }
        )
        
        # Sauvegarder la commande
        restaurant_state['orders'][order_id] = {
            'table_number': table_number,
            'status': 'pending',
            'payment_intent': intent.id
        }
        
        return jsonify({
            'clientSecret': intent.client_secret,
            'order_id': order_id
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 403

@socketio.on('add_furniture')
def handle_add_furniture(data):
    x, y = data['x'], data['y']
    furniture_type = data['type']
    
    # Vérifier si l'emplacement est libre
    width = 2 if furniture_type == 'small_table' else 8 if furniture_type == 'large_table' else 1
    height = width
    
    # Vérifier les collisions
    for furniture in restaurant_state['furniture']:
        if any(furniture['x'] <= px < furniture['x'] + furniture['width'] and
               furniture['y'] <= py < furniture['y'] + furniture['height']
               for px in range(x, x + width)
               for py in range(y, y + height)):
            return
    
    new_furniture = {
        'x': x,
        'y': y,
        'width': width,
        'height': height,
        'type': furniture_type,
        'state': 'FREE',
        'occupied_chairs': [],
    }
    
    if furniture_type in ['small_table', 'large_table']:
        new_furniture['table_number'] = restaurant_state['table_counter']
        restaurant_state['table_counter'] += 1
    
    restaurant_state['furniture'].append(new_furniture)
    emit('update_state', restaurant_state, broadcast=True)

@socketio.on('remove_furniture')
def handle_remove_furniture(data):
    furniture_id = data['id']
    restaurant_state['furniture'] = [f for f in restaurant_state['furniture'] if f.get('id') != furniture_id]
    emit('update_state', restaurant_state, broadcast=True)

@socketio.on('update_table_state')
def handle_update_table_state(data):
    furniture_id = data['id']
    new_state = data['state']
    for furniture in restaurant_state['furniture']:
        if furniture.get('id') == furniture_id:
            furniture['state'] = new_state
            break
    emit('update_state', restaurant_state, broadcast=True)

@socketio.on('toggle_chair_occupation')
def handle_toggle_chair_occupation(data):
    chair_id = data['id']
    for furniture in restaurant_state['furniture']:
        if furniture.get('id') == chair_id and furniture['type'] == 'chair':
            furniture['occupied'] = not furniture.get('occupied', False)
            break
    emit('update_state', restaurant_state, broadcast=True)

@socketio.on('order_completed')
def handle_order_completed(data):
    order_id = data['order_id']
    if order_id in restaurant_state['orders']:
        restaurant_state['orders'][order_id]['status'] = 'completed'
        emit('order_status_update', {
            'order_id': order_id,
            'status': 'completed'
        }, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, debug=True)
