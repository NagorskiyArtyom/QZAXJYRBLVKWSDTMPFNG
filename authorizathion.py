from flask import Flask, render_template, request, redirect, url_for, session, flash, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import os

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
                flash('Вход выполнен успешно!', 'success')
                return redirect(url_for('index'))
            flash('Неверные учетные данные', 'error')

        elif 'register' in request.form:
            username = request.form['username']
            password = request.form['password']
            name = request.form['name']

            if User.query.filter_by(username=username).first():
                flash('Этот email уже занят', 'error')
            elif User.query.filter_by(name=name).first():
                flash('Этот никнейм уже занят', 'error')
            else:
                new_user = User(
                    username=username,
                    password=generate_password_hash(password),
                    name=name
                )
                db.session.add(new_user)
                db.session.commit()
                flash('Регистрация успешна! Теперь войдите.', 'success')
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
    flash('Вы вышли из системы', 'info')
    return redirect(url_for('index'))


if __name__ == '__main__':
    app.run(debug=True)