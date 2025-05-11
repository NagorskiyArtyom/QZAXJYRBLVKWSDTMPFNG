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
        db.func.count(Card.id).label('cards_count')
    ).join(
        User, User.id == Card.user_id
    ).filter(
        Card.user_id == session['user_id']
    ).group_by(
        Card.test_name
    ).all()

    tests_data = [{
        'test_name': test.test_name,
        'username': test.username,
        'avatar': test.avatar,
        'cards_count': test.cards_count
    } for test in tests]

    return jsonify(tests_data)


@app.route('/get_all_tests')
def get_all_tests():
    tests = db.session.query(
        Card.test_name,
        User.username,
        User.avatar,
        db.func.count(Card.id).label('cards_count')
    ).join(
        User, User.id == Card.user_id
    ).group_by(
        Card.test_name, User.username, User.avatar
    ).all()

    tests_data = [{
        'test_name': test.test_name,
        'username': test.username,
        'avatar': test.avatar,
        'cards_count': test.cards_count
    } for test in tests]

    return jsonify(tests_data)


@app.route('/home')
def home():
    return render_template('index.html', user=session.get('user_id') and User.query.get(session['user_id']))


if __name__ == '__main__':
    app.run(debug=True)
