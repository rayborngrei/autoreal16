#!/usr/bin/env python3
"""
Генератор изображений для сайта Автореал16
Создаёт placeholder-изображения с градиентами и силуэтами автомобилей
"""

import os
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

OUTPUT_DIR = "/workspace/dist/img"
CARS_DIR = "/workspace/dist/cars"

# Цветовая палитра сайта
COLORS = {
    'bg_dark': '#0E0E0F',
    'bg_mid': '#16161B',
    'accent': '#C41414',
    'accent_light': '#E04A46',
    'text': '#FFFFFF',
    'text_dim': '#9CA0AC',
    'car_body': '#1D212A',
    'car_highlight': '#2B2F3B',
}

def create_gradient(width, height, colors, direction='vertical'):
    """Создаёт градиентный фон"""
    base = Image.new('RGB', (width, height), COLORS['bg_dark'])
    draw = ImageDraw.Draw(base)
    
    if direction == 'vertical':
        for y in range(height):
            r = int(colors[0][0] + (colors[1][0] - colors[0][0]) * y / height)
            g = int(colors[0][1] + (colors[1][1] - colors[0][1]) * y / height)
            b = int(colors[0][2] + (colors[1][2] - colors[0][2]) * y / height)
            draw.line([(0, y), (width, y)], fill=(r, g, b))
    elif direction == 'horizontal':
        for x in range(width):
            r = int(colors[0][0] + (colors[1][0] - colors[0][0]) * x / width)
            g = int(colors[0][1] + (colors[1][1] - colors[0][1]) * x / width)
            b = int(colors[0][2] + (colors[1][2] - colors[0][2]) * x / width)
            draw.line([(x, 0), (x, height)], fill=(r, g, b))
    
    return base

def hex_to_rgb(hex_color):
    """Конвертирует hex цвет в RGB кортеж"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def draw_car_silhouette(draw, width, height, car_type='sedan', color='#1D212A', position='center'):
    """Рисует силуэт автомобиля"""
    
    # Определяем позицию
    if position == 'center':
        offset_x = width // 2
        offset_y = height // 2 + 50
    elif position == 'left':
        offset_x = width // 3
        offset_y = height // 2 + 50
    elif position == 'right':
        offset_x = width * 2 // 3
        offset_y = height // 2 + 50
    else:
        offset_x, offset_y = position
    
    car_color = hex_to_rgb(color)
    highlight_color = tuple(min(255, c + 30) for c in car_color)
    
    if car_type == 'sedan':
        # Силуэт седана
        points = [
            (offset_x - 180, offset_y + 40),
            (offset_x - 180, offset_y + 10),
            (offset_x - 140, offset_y - 20),
            (offset_x - 80, offset_y - 35),
            (offset_x - 20, offset_y - 35),
            (offset_x + 30, offset_y - 20),
            (offset_x + 80, offset_y - 10),
            (offset_x + 180, offset_y + 10),
            (offset_x + 180, offset_y + 40),
            (offset_x + 180, offset_y + 70),
            (offset_x + 140, offset_y + 70),
            (offset_x + 130, offset_y + 50),
            (offset_x - 130, offset_y + 50),
            (offset_x - 140, offset_y + 70),
            (offset_x - 180, offset_y + 70),
        ]
    elif car_type == 'suv':
        # Силуэт внедорожника
        points = [
            (offset_x - 170, offset_y + 40),
            (offset_x - 170, offset_y),
            (offset_x - 130, offset_y - 30),
            (offset_x - 70, offset_y - 45),
            (offset_x - 20, offset_y - 45),
            (offset_x + 30, offset_y - 30),
            (offset_x + 80, offset_y - 20),
            (offset_x + 170, offset_y),
            (offset_x + 170, offset_y + 40),
            (offset_x + 170, offset_y + 70),
            (offset_x + 130, offset_y + 70),
            (offset_x + 120, offset_y + 50),
            (offset_x - 120, offset_y + 50),
            (offset_x - 130, offset_y + 70),
            (offset_x - 170, offset_y + 70),
        ]
    elif car_type == 'hatchback':
        # Силуэт хетчбэка
        points = [
            (offset_x - 160, offset_y + 40),
            (offset_x - 160, offset_y + 10),
            (offset_x - 120, offset_y - 15),
            (offset_x - 60, offset_y - 30),
            (offset_x - 10, offset_y - 30),
            (offset_x + 40, offset_y - 15),
            (offset_x + 160, offset_y + 10),
            (offset_x + 160, offset_y + 40),
            (offset_x + 160, offset_y + 70),
            (offset_x + 120, offset_y + 70),
            (offset_x + 110, offset_y + 50),
            (offset_x - 110, offset_y + 50),
            (offset_x - 120, offset_y + 70),
            (offset_x - 160, offset_y + 70),
        ]
    else:  # crossover
        points = [
            (offset_x - 170, offset_y + 40),
            (offset_x - 170, offset_y + 5),
            (offset_x - 130, offset_y - 25),
            (offset_x - 70, offset_y - 40),
            (offset_x - 20, offset_y - 40),
            (offset_x + 30, offset_y - 25),
            (offset_x + 80, offset_y - 15),
            (offset_x + 170, offset_y + 5),
            (offset_x + 170, offset_y + 40),
            (offset_x + 170, offset_y + 70),
            (offset_x + 130, offset_y + 70),
            (offset_x + 120, offset_y + 50),
            (offset_x - 120, offset_y + 50),
            (offset_x - 130, offset_y + 70),
            (offset_x - 170, offset_y + 70),
        ]
    
    # Рисуем основной силуэт
    draw.polygon(points, fill=car_color)
    
    # Добавляем блик
    highlight_points = [(p[0], p[1] - 5) for p in points[:8]]
    if len(highlight_points) >= 3:
        draw.polygon(highlight_points[:6], fill=highlight_color)
    
    # Колёса
    wheel_color = (20, 20, 25)
    wheel_positions = [
        (offset_x - 100, offset_y + 70),
        (offset_x + 100, offset_y + 70),
    ]
    
    for wx, wy in wheel_positions:
        # Основное колесо
        draw.ellipse([wx - 28, wy - 28, wx + 28, wy + 28], fill=wheel_color)
        # Диск
        draw.ellipse([wx - 18, wy - 18, wx + 18, wy + 18], fill=(35, 35, 42))
        # Центр диска
        draw.ellipse([wx - 8, wy - 8, wx + 8, wy + 8], fill=(55, 55, 65))

def draw_headlight(draw, x, y, size=20, glow=True):
    """Рисует фару автомобиля"""
    if glow:
        # Светящийся эффект
        for i in range(3, 0, -1):
            alpha = int(80 / i)
            color = (200, 200, 220, alpha)
            draw.ellipse([x - size*i, y - size*i//2, x + size*i, y + size*i//2], 
                        fill=color)
    
    # Основная фара
    draw.ellipse([x - size, y - size//2, x + size, y + size//2], 
                fill=(255, 255, 240))
    
    # Яркий центр
    draw.ellipse([x - size//2, y - size//4, x + size//2, y + size//4], 
                fill=(255, 255, 255))

def draw_mountain_range(draw, width, height, color='#1D212A', layers=3):
    """Рисует горный пейзаж на заднем плане"""
    base_y = height * 0.7
    
    for layer in range(layers):
        offset = layer * 30
        layer_color = tuple(max(0, c - layer * 15) for c in hex_to_rgb(color))
        
        points = [(0, height)]
        for x in range(0, width + 1, 80):
            y = base_y - offset - ((x * 0.01) % 50) - ((x * 0.02) % 30)
            if layer == 0:
                y -= ((x * 0.005) % 80)
            points.append((x, y))
        points.append((width, height))
        
        draw.polygon(points, fill=layer_color)

def draw_grid_overlay(draw, width, height, opacity=0.1):
    """Добавляет сетку как на оригинальном SVG"""
    grid_color = (58, 58, 66, int(255 * opacity))
    
    # Вертикальные линии
    for x in range(0, width, 240):
        draw.line([(x, 0), (x, height)], fill=grid_color, width=1)
    
    # Горизонтальные линии (редкие)
    for y in range(0, height, 300):
        draw.line([(0, y), (width, y)], fill=grid_color, width=1)

def draw_sun_moon(draw, width, height, cx=None, cy=None, radius=100):
    """Рисует солнце/луну с эффектом свечения"""
    if cx is None:
        cx = width * 0.75
    if cy is None:
        cy = height * 0.3
    
    # Внешнее свечение
    for i in range(5, 0, -1):
        alpha = int(60 / i)
        color = (196, 20, 20, alpha)  # Красный акцент
        draw.ellipse([cx - radius*i, cy - radius*i, cx + radius*i, cy + radius*i], 
                    fill=color)
    
    # Основной круг
    draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], 
                fill=(196, 20, 20, 80))
    
    # Кольца
    for r in range(radius + 20, radius + 60, 20):
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], 
                    outline=(224, 74, 70, int(80 * (1 - (r - radius) / 40))), 
                    width=1)

def generate_hero_image():
    """Генерирует главное изображение для hero-блока"""
    print("Генерация hero изображения...")
    
    width, height = 1920, 1080
    img = Image.new('RGB', (width, height), COLORS['bg_dark'])
    draw = ImageDraw.Draw(img)
    
    # Градиентный фон (ночное небо)
    gradient_colors = [hex_to_rgb('#16161B'), hex_to_rgb('#0B0B0E')]
    for y in range(height):
        ratio = y / height
        r = int(gradient_colors[0][0] + (gradient_colors[1][0] - gradient_colors[0][0]) * ratio)
        g = int(gradient_colors[0][1] + (gradient_colors[1][1] - gradient_colors[0][1]) * ratio)
        b = int(gradient_colors[0][2] + (gradient_colors[1][2] - gradient_colors[0][2]) * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    
    # Сетка
    draw_grid_overlay(draw, width, height, opacity=0.15)
    
    # Солнце/луна
    draw_sun_moon(draw, width, height)
    
    # Горы на заднем плане
    draw_mountain_range(draw, width, height, layers=4)
    
    # Автомобиль (седан)
    draw_car_silhouette(draw, width, height, car_type='sedan', 
                       color='#252A35', position=('center'))
    
    # Туман/дымка
    for i in range(3):
        y_pos = height * 0.65 + i * 40
        alpha = int(30 - i * 8)
        draw.rectangle([0, y_pos, width, y_pos + 30], 
                      fill=(156, 160, 172, alpha))
    
    # Затемнение снизу
    for y in range(height - 200, height):
        alpha = int(200 * (y - (height - 200)) / 200)
        draw.line([(0, y), (width, y)], fill=(10, 10, 12, alpha))
    
    # Сохраняем
    img.save(f"{OUTPUT_DIR}/hero_main.webp", "WEBP", quality=85)
    print(f"  ✓ Создано: {OUTPUT_DIR}/hero_main.webp")
    
    # Создаём уменьшенную версию
    img_small = img.resize((960, 540), Image.Resampling.LANCZOS)
    img_small.save(f"{OUTPUT_DIR}/hero_main_s.webp", "WEBP", quality=75)
    print(f"  ✓ Создано: {OUTPUT_DIR}/hero_main_s.webp")
    
    return img

def generate_why_image():
    """Генерирует изображение для блока 'Почему мы' (фара крупно)"""
    print("Генерация изображения для блока 'Почему мы'...")
    
    width, height = 800, 600
    img = Image.new('RGB', (width, height), COLORS['bg_dark'])
    draw = ImageDraw.Draw(img)
    
    # Градиент
    gradient_colors = [hex_to_rgb('#1A1A1F'), hex_to_rgb('#0D0D0F')]
    for y in range(height):
        ratio = y / height
        r = int(gradient_colors[0][0] + (gradient_colors[1][0] - gradient_colors[0][0]) * ratio)
        g = int(gradient_colors[0][1] + (gradient_colors[1][1] - gradient_colors[0][1]) * ratio)
        b = int(gradient_colors[0][2] + (gradient_colors[1][2] - gradient_colors[0][2]) * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    
    # Крупная фара
    draw_headlight(draw, width // 2, height // 2, size=80, glow=True)
    
    # Часть капота
    cap_color = hex_to_rgb('#2B2F3B')
    cap_points = [
        (width * 0.2, height * 0.6),
        (width * 0.3, height * 0.45),
        (width * 0.7, height * 0.45),
        (width * 0.8, height * 0.6),
        (width * 0.8, height * 0.7),
        (width * 0.2, height * 0.7),
    ]
    draw.polygon(cap_points, fill=cap_color)
    
    # Блик на капоте
    highlight_points = [
        (width * 0.35, height * 0.48),
        (width * 0.65, height * 0.48),
        (width * 0.6, height * 0.52),
        (width * 0.4, height * 0.52),
    ]
    draw.polygon(highlight_points, fill=tuple(min(255, c + 40) for c in cap_color))
    
    img.save(f"{OUTPUT_DIR}/why_detail.webp", "WEBP", quality=85)
    print(f"  ✓ Создано: {OUTPUT_DIR}/why_detail.webp")

def generate_calc_image():
    """Генерирует изображение для калькулятора (скриншот интерфейса)"""
    print("Генерация изображения для калькулятора...")
    
    width, height = 900, 600
    img = Image.new('RGB', (width, height), '#141418')
    draw = ImageDraw.Draw(img)
    
    # Фон интерфейса
    draw.rectangle([20, 20, width - 20, height - 20], fill='#1A1A1F')
    
    # Заголовок
    draw.text((40, 40), "Калькулятор стоимости", fill='#FFFFFF')
    draw.line([(40, 70), (300, 70)], fill='#C41414', width=2)
    
    # Поля формы
    field_y = 100
    for i, label in enumerate(["Марка автомобиля", "Модель", "Год выпуска", "Тип кузова"]):
        # Метка поля
        draw.text((40, field_y), label, fill='#9CA0AC')
        # Поле ввода
        draw.rectangle([40, field_y + 20, width - 40, field_y + 55], 
                      fill='#202025', outline='#2A2A30')
        field_y += 70
    
    # Кнопка "Рассчитать"
    draw.rectangle([40, field_y + 10, 250, field_y + 55], fill='#C41414')
    draw.text((80, field_y + 25), "Рассчитать стоимость", fill='#FFFFFF')
    
    # График справа
    chart_x = width // 2 + 50
    draw.rectangle([chart_x, 100, width - 40, height - 40], fill='#1D1D22')
    
    # Столбцы графика
    bar_width = 40
    bars = [120, 180, 150, 200, 160]
    for i, h in enumerate(bars):
        x = chart_x + 30 + i * (bar_width + 20)
        draw.rectangle([x, height - 60 - h, x + bar_width, height - 60], 
                      fill='#C41414' if i == 3 else '#3A3A42')
    
    img.save(f"{OUTPUT_DIR}/calc_interface.webp", "WEBP", quality=85)
    print(f"  ✓ Создано: {OUTPUT_DIR}/calc_interface.webp")

def generate_faq_image():
    """Генерирует изображение для FAQ (пагода, сакура, красный диск)"""
    print("Генерация изображения для FAQ...")
    
    width, height = 800, 600
    img = Image.new('RGB', (width, height), '#0B0B0E')
    draw = ImageDraw.Draw(img)
    
    # Ночное небо с градиентом
    for y in range(height):
        ratio = y / height
        r = int(22 + 5 * ratio)
        g = int(22 + 3 * ratio)
        b = int(30 + 5 * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    
    # Красный диск (луна/солнце)
    draw.ellipse([width - 200, 80, width - 50, 230], fill=(196, 20, 20, 100))
    draw.ellipse([width - 190, 90, width - 60, 220], fill=(196, 20, 20, 60))
    
    # Пагода (силуэт)
    pagoda_color = (25, 25, 30)
    pagoda_points = [
        (width * 0.15, height),
        (width * 0.15, height * 0.7),
        (width * 0.25, height * 0.65),
        (width * 0.25, height * 0.55),
        (width * 0.35, height * 0.5),
        (width * 0.35, height * 0.4),
        (width * 0.45, height * 0.35),
        (width * 0.45, height * 0.25),
        (width * 0.5, height * 0.2),
        (width * 0.55, height * 0.25),
        (width * 0.55, height * 0.35),
        (width * 0.65, height * 0.4),
        (width * 0.65, height * 0.5),
        (width * 0.75, height * 0.55),
        (width * 0.75, height * 0.65),
        (width * 0.85, height * 0.7),
        (width * 0.85, height),
    ]
    draw.polygon(pagoda_points, fill=pagoda_color)
    
    # Сакура (ветки с цветами)
    branch_color = (45, 35, 35)
    flower_color = (255, 180, 200, 180)
    
    # Ветка слева
    draw.line([(0, height * 0.3), (width * 0.3, height * 0.4)], 
             fill=branch_color, width=4)
    
    # Цветы сакуры
    import random
    random.seed(42)
    for _ in range(30):
        x = random.randint(0, width // 3)
        y = random.randint(int(height * 0.2), int(height * 0.5))
        size = random.randint(3, 8)
        draw.ellipse([x - size, y - size, x + size, y + size], fill=flower_color)
    
    img.save(f"{OUTPUT_DIR}/faq_landscape.webp", "WEBP", quality=85)
    print(f"  ✓ Создано: {OUTPUT_DIR}/faq_landscape.webp")

def generate_cta_image():
    """Генерирует CTA изображение (машина + силуэт пагоды)"""
    print("Генерация CTA изображения...")
    
    width, height = 1680, 720  # 21:9
    img = Image.new('RGB', (width, height), COLORS['bg_dark'])
    draw = ImageDraw.Draw(img)
    
    # Градиент фона
    gradient_colors = [hex_to_rgb('#121216'), hex_to_rgb('#08080A')]
    for y in range(height):
        ratio = y / height
        r = int(gradient_colors[0][0] + (gradient_colors[1][0] - gradient_colors[0][0]) * ratio)
        g = int(gradient_colors[0][1] + (gradient_colors[1][1] - gradient_colors[0][1]) * ratio)
        b = int(gradient_colors[0][2] + (gradient_colors[1][2] - gradient_colors[0][2]) * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    
    # Сетка
    draw_grid_overlay(draw, width, height, opacity=0.08)
    
    # Автомобиль слева
    draw_car_silhouette(draw, width, height, car_type='suv', 
                       color='#2A2F3A', position=(width * 0.35, height * 0.65))
    
    # Пагода справа (маленькая)
    pagoda_color = (35, 35, 40)
    pagoda_center = width * 0.75
    pagoda_base = height * 0.65
    
    for tier in range(5):
        tier_y = pagoda_base - tier * 35
        tier_width = 120 - tier * 18
        draw.polygon([
            (pagoda_center - tier_width, tier_y + 35),
            (pagoda_center - tier_width + 10, tier_y),
            (pagoda_center + tier_width - 10, tier_y),
            (pagoda_center + tier_width, tier_y + 35),
        ], fill=pagoda_color)
    
    # Красный диск за пагодой
    draw.ellipse([pagoda_center - 80, pagoda_base - 180, 
                 pagoda_center + 80, pagoda_base - 20], 
                fill=(196, 20, 20, 50))
    
    img.save(f"{OUTPUT_DIR}/cta_banner.webp", "WEBP", quality=85)
    print(f"  ✓ Создано: {OUTPUT_DIR}/cta_banner.webp")

def generate_order_images():
    """Генерирует изображения для блока заказа (модели из Китая)"""
    print("Генерация изображений для блока заказа...")
    
    models = [
        ("Geely Monjaro", "suv"),
        ("Chery Tiggo 8", "suv"),
        ("Haval Jolion", "crossover"),
        ("Li Auto L7", "suv"),
        ("Zeekr 001", "sedan"),
        ("Voyah Free", "suv"),
    ]
    
    for model_name, car_type in models:
        width, height = 600, 400
        img = Image.new('RGB', (width, height), '#101014')
        draw = ImageDraw.Draw(img)
        
        # Градиент
        for y in range(height):
            ratio = y / height
            r = int(16 + 8 * ratio)
            g = int(16 + 5 * ratio)
            b = int(20 + 8 * ratio)
            draw.line([(0, y), (width, y)], fill=(r, g, b))
        
        # Автомобиль
        draw_car_silhouette(draw, width, height, car_type=car_type, 
                           color='#2D323D', position=(width // 2, height // 2 + 30))
        
        # Название модели
        draw.text((20, 20), model_name, fill='#FFFFFF')
        
        # Сохраняем
        safe_name = model_name.replace(" ", "_").lower()
        img.save(f"{OUTPUT_DIR}/order_{safe_name}.webp", "WEBP", quality=85)
        print(f"  ✓ Создано: {OUTPUT_DIR}/order_{safe_name}.webp")

def generate_car_card_images():
    """Генерирует изображения для карточек автомобилей в каталоге"""
    print("Генерация изображений для карточек автомобилей...")
    
    cars = [
        ("chevrolet-cruze-2012", "Chevrolet Cruze", "hatchback", 2012),
        ("nissan-qashqai-2026", "Nissan Qashqai", "suv", 2026),
        ("mazda-cx-5-2026", "Mazda CX-5", "suv", 2026),
        ("ford-mondeo-2018", "Ford Mondeo", "sedan", 2018),
        ("volkswagen-tharu-xr-2026", "Volkswagen Tharu XR", "suv", 2026),
        ("volkswagen-t-roc-2022", "Volkswagen T-Roc", "crossover", 2022),
        ("bmw-x4-2019", "BMW X4", "suv", 2019),
        ("genesis-g80-2017", "Genesis G80", "sedan", 2017),
        ("hyundai-creta-2025", "Hyundai Creta", "suv", 2025),
    ]
    
    for folder, name, car_type, year in cars:
        car_dir = f"{CARS_DIR}/{folder}"
        os.makedirs(car_dir, exist_ok=True)
        
        # Основное изображение
        width, height = 1200, 900
        img = Image.new('RGB', (width, height), '#141418')
        draw = ImageDraw.Draw(img)
        
        # Градиент фона
        for y in range(height):
            ratio = y / height
            r = int(20 + 10 * ratio)
            g = int(20 + 8 * ratio)
            b = int(24 + 10 * ratio)
            draw.line([(0, y), (width, y)], fill=(r, g, b))
        
        # Автомобиль по центру
        draw_car_silhouette(draw, width, height, car_type=car_type, 
                           color='#323842', position=(width // 2, height // 2 + 50))
        
        # Название и год
        draw.text((40, 40), f"{name} ({year})", fill='#FFFFFF')
        
        # Сохраняем большое изображение
        img.save(f"{car_dir}/01.webp", "WEBP", quality=85)
        
        # Маленькое изображение для карточки
        img_small = img.resize((560, 560), Image.Resampling.LANCZOS)
        img_small.save(f"{car_dir}/01_s.webp", "WEBP", quality=75)
        
        # Дополнительные ракурсы (просто вариации цвета)
        for i, shade in enumerate([28, 35, 42], 2):
            img_alt = img.copy()
            draw_alt = ImageDraw.Draw(img_alt)
            draw_car_silhouette(draw_alt, width, height, car_type=car_type, 
                               color=f'#{shade:02x}{shade+5:02x}{shade+10:02x}', 
                               position=(width // 2, height // 2 + 50))
            img_alt.save(f"{car_dir}/{i:02d}.webp", "WEBP", quality=85)
            img_alt_small = img_alt.resize((560, 560), Image.Resampling.LANCZOS)
            img_alt_small.save(f"{car_dir}/{i:02d}_s.webp", "WEBP", quality=75)
        
        print(f"  ✓ Создано: {car_dir}/01.webp и другие")

def main():
    """Основная функция генерации всех изображений"""
    print("=" * 60)
    print("Генератор изображений для сайта Автореал16")
    print("=" * 60)
    print()
    
    # Создаём директорию если не существует
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Генерируем все изображения
    generate_hero_image()
    print()
    generate_why_image()
    print()
    generate_calc_image()
    print()
    generate_faq_image()
    print()
    generate_cta_image()
    print()
    generate_order_images()
    print()
    generate_car_card_images()
    print()
    
    print("=" * 60)
    print("✓ Все изображения успешно созданы!")
    print("=" * 60)

if __name__ == "__main__":
    main()
