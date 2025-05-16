from flask import Flask, render_template, request, redirect, url_for, session, flash, send_from_directory, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import os
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'super_secret_key_12345'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///user.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'instance'
db = SQLAlchemy(app)

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    avatar = db.Column(db.String(100))
    cards = db.relationship('Card', backref='user', lazy=True)


class Card(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    front_text = db.Column(db.String(500), nullable=False)
    back_text = db.Column(db.String(500), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    test_name = db.Column(db.String(100))


class Saved(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    creator_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    test_name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    post = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    get = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    time = db.Column(db.DateTime, default=datetime.utcnow)
    stability = db.Column(db.String(20), nullable=False)
    test_name = db.Column(db.String(100), nullable=False)
    test_creator_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)


class Friendship(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    first_friend = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    second_friend = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    stability = db.Column(db.String(20), nullable=False)


with app.app_context():
    db.create_all()


@app.route('/', methods=['GET', 'POST'])
def index():
    user = None
    if 'user_id' in session:
        user = User.query.get(session['user_id'])

    if request.method == 'POST':
        if 'login' in request.form:
            username = request.form['username']
            password = request.form['password']
            user = User.query.filter_by(username=username).first()

            if user and check_password_hash(user.password, password):
                session['user_id'] = user.id
                return redirect(url_for('index'))

        elif 'register' in request.form:
            username = request.form['username']
            password = request.form['password']
            name = request.form['name']

            if User.query.filter_by(username=username).first():
                return redirect(url_for('index'))
            elif User.query.filter_by(name=name).first():
                return redirect(url_for('index'))
            else:
                new_user = User(
                    username=username,
                    password=generate_password_hash(password),
                    name=name
                )
                db.session.add(new_user)
                db.session.commit()
                return redirect(url_for('index'))

    return render_template('index.html', user=user)


@app.route('/upload_avatar', methods=['POST'])
def upload_avatar():
    if 'user_id' not in session:
        return redirect(url_for('index'))

    user = User.query.get(session['user_id'])
    if 'avatar' not in request.files:
        flash('Файл не выбран', 'error')
        return redirect(url_for('index'))

    file = request.files['avatar']
    if file.filename == '':
        flash('Файл не выбран', 'error')
        return redirect(url_for('index'))

    if file and allowed_file(file.filename):
        filename = f"user_{user.id}.jpg"
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        user.avatar = filename
        db.session.commit()
        flash('Аватар успешно обновлен!', 'success')

    return redirect(url_for('index'))


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'jpg', 'jpeg', 'png'}


@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('index'))


@app.route('/add_card', methods=['POST'])
def add_card():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authorized'}), 401

    data = request.get_json()
    if not data or 'front_text' not in data or 'back_text' not in data or 'test_name' not in data:
        return jsonify({'error': 'Invalid data'}), 400

    existing_test = Card.query.filter_by(
        user_id=session['user_id'],
        test_name=data['test_name']
    ).first()

    if existing_test:
        return jsonify({'error': 'У вас уже есть тест с таким названием'}), 400

    new_card = Card(
        front_text=data['front_text'],
        back_text=data['back_text'],
        test_name=data['test_name'],
        user_id=session['user_id']
    )

    try:
        db.session.add(new_card)
        db.session.commit()
        return jsonify({
            'id': new_card.id,
            'front_text': new_card.front_text,
            'back_text': new_card.back_text,
            'test_name': new_card.test_name,
            'created_at': new_card.created_at.strftime('%Y-%m-%d %H:%M')
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/get_cards')
def get_cards():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authorized'}), 401

    cards = Card.query.filter_by(user_id=session['user_id']).order_by(Card.created_at.desc()).all()
    cards_data = [{
        'id': card.id,
        'front_text': card.front_text,
        'back_text': card.back_text,
        'test_name': card.test_name,
        'created_at': card.created_at.strftime('%Y-%m-%d %H:%M')
    } for card in cards]

    return jsonify(cards_data)


@app.route('/delete_card/<int:card_id>', methods=['DELETE'])
def delete_card(card_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Not authorized'}), 401

    card = Card.query.filter_by(id=card_id, user_id=session['user_id']).first()
    if not card:
        return jsonify({'error': 'Card not found'}), 404

    try:
        db.session.delete(card)
        db.session.commit()
        return jsonify({'success': True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/get_tests')
def get_tests():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authorized'}), 401

    tests = db.session.query(
        Card.test_name,
        User.username,
        User.avatar,
        User.id.label('creator_id'),
        db.func.count(Card.id).label('cards_count')
    ).join(
        User, User.id == Card.user_id
    ).filter(
        Card.user_id == session['user_id']
    ).group_by(
        Card.test_name, User.username, User.avatar, User.id
    ).all()

    tests_data = [{
        'test_name': test.test_name,
        'username': test.username,
        'avatar': test.avatar,
        'creator_id': test.creator_id,
        'cards_count': test.cards_count,
        'is_saved': False
    } for test in tests]

    return jsonify(tests_data)


@app.route('/get_all_tests')
def get_all_tests():
    user_id = session.get('user_id')
    tests = db.session.query(
        Card.test_name,
        User.username,
        User.avatar,
        User.id.label('creator_id'),
        db.func.count(Card.id).label('cards_count')
    ).join(
        User, User.id == Card.user_id
    ).group_by(
        Card.test_name, User.username, User.avatar, User.id
    ).all()

    tests_data = []
    for test in tests:
        test_dict = {
            'test_name': test.test_name,
            'username': test.username,
            'avatar': test.avatar,
            'creator_id': test.creator_id,
            'cards_count': test.cards_count
        }
        if user_id:
            is_saved = db.session.query(Saved).filter_by(
                user_id=user_id,
                creator_id=test.creator_id,
                test_name=test.test_name
            ).first() is not None
            test_dict['is_saved'] = is_saved
        tests_data.append(test_dict)

    return jsonify(tests_data)


@app.route('/home')
def home():
    return render_template('index.html', user=session.get('user_id') and User.query.get(session['user_id']))


@app.route('/save_test', methods=['POST'])
def save_test():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authorized'}), 401

    data = request.get_json()
    if not data or 'creator_id' not in data or 'test_name' not in data:
        return jsonify({'error': 'Invalid data'}), 400

    existing = Saved.query.filter_by(
        user_id=session['user_id'],
        creator_id=data['creator_id'],
        test_name=data['test_name']
    ).first()

    if existing:
        return jsonify({'error': 'Test already saved'}), 400

    new_saved = Saved(
        user_id=session['user_id'],
        creator_id=data['creator_id'],
        test_name=data['test_name']
    )

    try:
        db.session.add(new_saved)
        db.session.commit()
        return jsonify({'success': True}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/unsave_test', methods=['POST'])
def unsave_test():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authorized'}), 401

    data = request.get_json()
    if not data or 'creator_id' not in data or 'test_name' not in data:
        return jsonify({'error': 'Invalid data'}), 400

    saved_test = Saved.query.filter_by(
        user_id=session['user_id'],
        creator_id=data['creator_id'],
        test_name=data['test_name']
    ).first()

    if not saved_test:
        return jsonify({'error': 'Test not found in saved'}), 404

    try:
        db.session.delete(saved_test)
        db.session.commit()
        return jsonify({'success': True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/get_saved_tests')
def get_saved_tests():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authorized'}), 401

    saved_tests = db.session.query(
        Card.test_name,
        User.username,
        User.avatar,
        User.id.label('creator_id'),
        db.func.count(Card.id).label('cards_count')
    ).join(
        User, User.id == Card.user_id
    ).join(
        Saved, db.and_(
            Saved.test_name == Card.test_name,
            Saved.creator_id == Card.user_id
        )
    ).filter(
        Saved.user_id == session['user_id']
    ).group_by(
        Card.test_name, User.username, User.avatar, User.id
    ).all()

    tests_data = [{
        'test_name': test.test_name,
        'username': test.username,
        'avatar': test.avatar,
        'creator_id': test.creator_id,
        'cards_count': test.cards_count
    } for test in saved_tests]

    return jsonify(tests_data)


@app.route('/get_chats')
def get_chats():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authorized'}), 401

    friends = db.session.query(
        User.id,
        User.name,
        User.avatar,
        db.func.max(Message.time).label('last_message_time')
    ).join(
        Friendship,
        db.or_(
            db.and_(
                Friendship.first_friend == session['user_id'],
                Friendship.second_friend == User.id,
                Friendship.stability == 'friend'
            ),
            db.and_(
                Friendship.second_friend == session['user_id'],
                Friendship.first_friend == User.id,
                Friendship.stability == 'friend'
            )
        )
    ).outerjoin(
        Message,
        db.or_(
            db.and_(
                Message.post == session['user_id'],
                Message.get == User.id
            ),
            db.and_(
                Message.post == User.id,
                Message.get == session['user_id']
            )
        )
    ).group_by(
        User.id, User.name, User.avatar
    ).all()

    chats_data = []
    for friend in friends:
        last_message = Message.query.filter(
            db.or_(
                db.and_(
                    Message.post == session['user_id'],
                    Message.get == friend.id
                ),
                db.and_(
                    Message.post == friend.id,
                    Message.get == session['user_id']
                )
            )
        ).order_by(Message.time.desc()).first()

        chats_data.append({
            'id': friend.id,
            'name': friend.name,
            'avatar': friend.avatar,
            'last_message': last_message.test_name if last_message else None
        })

    return jsonify(chats_data)


@app.route('/get_friend_requests')
def get_friend_requests():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authorized'}), 401

    requests = db.session.query(
        User.id.label('sender_id'),
        User.name,
        User.avatar,
        Friendship.id.label('request_id')
    ).join(
        Friendship,
        Friendship.first_friend == User.id
    ).filter(
        Friendship.second_friend == session['user_id'],
        Friendship.stability == 'request'
    ).all()

    requests_data = [{
        'sender_id': req.sender_id,
        'name': req.name,
        'avatar': req.avatar,
        'request_id': req.request_id
    } for req in requests]

    return jsonify(requests_data)


@app.route('/search_friends')
def search_friends():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authorized'}), 401

    search_term = request.args.get('q', '').strip()
    if not search_term:
        return jsonify([])

    results = User.query.filter(
        User.name.ilike(f'%{search_term}%'),
        User.id != session['user_id']
    ).limit(10).all()

    results_data = [{
        'id': user.id,
        'name': user.name,
        'avatar': user.avatar
    } for user in results]

    return jsonify(results_data)


@app.route('/send_friend_request', methods=['POST'])
def send_friend_request():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authorized'}), 401

    data = request.get_json()
    if not data or 'user_id' not in data:
        return jsonify({'error': 'Invalid data'}), 400

    existing = Friendship.query.filter(
        db.or_(
            db.and_(
                Friendship.first_friend == session['user_id'],
                Friendship.second_friend == data['user_id']
            ),
            db.and_(
                Friendship.first_friend == data['user_id'],
                Friendship.second_friend == session['user_id']
            )
        )
    ).first()

    if existing:
        return jsonify({'error': 'Request already exists'}), 400

    new_request = Friendship(
        first_friend=session['user_id'],
        second_friend=data['user_id'],
        stability='request'
    )

    try:
        db.session.add(new_request)
        db.session.commit()
        return jsonify({'success': True}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/accept_friend_request', methods=['POST'])
def accept_friend_request():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authorized'}), 401

    data = request.get_json()
    if not data or 'request_id' not in data or 'sender_id' not in data:
        return jsonify({'error': 'Invalid data'}), 400

    request_entry = Friendship.query.filter(
        Friendship.id == data['request_id'],
        Friendship.first_friend == data['sender_id'],
        Friendship.second_friend == session['user_id'],
        Friendship.stability == 'request'
    ).first()

    if not request_entry:
        return jsonify({'error': 'Friend request not found or already processed'}), 404

    try:
        request_entry.stability = 'friend'
        db.session.commit()
        return jsonify({'success': True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/get_friends')
def get_friends():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authorized'}), 401

    friends = db.session.query(
        User.id,
        User.name,
        User.avatar
    ).join(
        Friendship,
        db.or_(
            db.and_(
                Friendship.first_friend == session['user_id'],
                Friendship.second_friend == User.id,
                Friendship.stability == 'friend'
            ),
            db.and_(
                Friendship.second_friend == session['user_id'],
                Friendship.first_friend == User.id,
                Friendship.stability == 'friend'
            )
        )
    ).all()

    friends_data = [{
        'id': friend.id,
        'name': friend.name,
        'avatar': friend.avatar
    } for friend in friends]

    return jsonify(friends_data)


@app.route('/send_message', methods=['POST'])
def send_message():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authorized'}), 401

    data = request.get_json()
    if not data or 'receiver_id' not in data or 'test_name' not in data or 'test_creator_id' not in data:
        return jsonify({'error': 'Invalid data'}), 400

    new_message = Message(
        post=session['user_id'],
        get=data['receiver_id'],
        stability='pending',
        test_name=data['test_name'],
        test_creator_id=data['test_creator_id']
    )

    try:
        db.session.add(new_message)
        db.session.commit()
        return jsonify({'success': True}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/get_messages')
def get_messages():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authorized'}), 401

    friend_id = request.args.get('friend_id')
    if not friend_id:
        return jsonify({'error': 'Friend ID required'}), 400

    messages = db.session.query(
        Message,
        User.name.label('sender_name'),
        User.avatar.label('sender_avatar')
    ).join(
        User, User.id == Message.post
    ).filter(
        db.or_(
            db.and_(Message.post == session['user_id'], Message.get == friend_id),
            db.and_(Message.post == friend_id, Message.get == session['user_id'])
        )
    ).order_by(Message.time.asc()).all()

    messages_data = []
    for message, sender_name, sender_avatar in messages:
        messages_data.append({
            'id': message.id,
            'test_name': message.test_name,
            'test_creator_id': message.test_creator_id,
            'time': message.time.isoformat(),
            'is_sender': message.post == session['user_id'],
            'sender_name': sender_name,
            'sender_avatar': sender_avatar,
            'status': message.stability
        })

    return jsonify(messages_data)


@app.route('/get_current_user_id')
def get_current_user_id():
    if 'user_id' in session:
        return jsonify({'user_id': session['user_id']})
    return jsonify({'error': 'Not authorized'}), 401


@app.route('/get_test_cards/<int:creator_id>/<test_name>')
def get_test_cards(creator_id, test_name):
    cards = Card.query.filter_by(
        user_id=creator_id,
        test_name=test_name
    ).all()

    if not cards:
        return jsonify({'error': 'Test not found'}), 404

    cards_data = [{
        'front_text': card.front_text,
        'back_text': card.back_text
    } for card in cards]

    return jsonify(cards_data)


@app.route('/play_test/<int:creator_id>/<test_name>')
def play_test(creator_id, test_name):
    if 'user_id' not in session:
        return redirect(url_for('index'))

    cards = Card.query.filter_by(
        user_id=creator_id,
        test_name=test_name
    ).all()

    if not cards:
        flash('Тест не найден', 'error')
        return redirect(url_for('index'))

    game_data = {card.front_text: card.back_text for card in cards}
    keys = list(game_data.keys())
    values = list(game_data.values())

    import random
    random.shuffle(keys)
    random.shuffle(values)

    return render_template('game.html',
                           test_name=test_name,
                           game_data=game_data,
                           keys=keys,
                           values=values,
                           cards=cards)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)
