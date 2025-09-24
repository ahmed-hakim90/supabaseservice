-- Insert sample spare parts linked to products
INSERT INTO spare_parts (name, part_number, category_id, product_id, price, description) VALUES
-- قطع غيار لمكيف شباك سوكاني
('مروحة المكيف', 'AC-FAN-001', (SELECT id FROM categories WHERE name = 'أجهزة المنزل'), (SELECT id FROM products WHERE name = 'مكيف هواء'), 150, 'مروحة داخلية للمكيف'),
('مكثف المكيف', 'AC-COND-001', (SELECT id FROM categories WHERE name = 'أجهزة المنزل'), (SELECT id FROM products WHERE name = 'مكيف هواء'), 300, 'مكثف خارجي للمكيف'),
('لوحة تحكم المكيف', 'AC-BOARD-001', (SELECT id FROM categories WHERE name = 'أجهزة المنزل'), (SELECT id FROM products WHERE name = 'مكيف هواء'), 200, 'لوحة إلكترونية للتحكم'),

-- قطع غيار لغسالة أتوماتيك
('محرك الغسالة', 'WM-MOTOR-001', (SELECT id FROM categories WHERE name = 'أجهزة المنزل'), (SELECT id FROM products WHERE name = 'غسالة أتوماتيك'), 400, 'محرك كهربائي للغسالة'),
('مضخة الغسالة', 'WM-PUMP-001', (SELECT id FROM categories WHERE name = 'أجهزة المنزل'), (SELECT id FROM products WHERE name = 'غسالة أتوماتيك'), 180, 'مضخة صرف المياه'),
('حساس الغسالة', 'WM-SENSOR-001', (SELECT id FROM categories WHERE name = 'أجهزة المنزل'), (SELECT id FROM products WHERE name = 'غسالة أتوماتيك'), 120, 'حساس مستوى المياه'),

-- قطع غيار عامة (غير مرتبطة بمنتج محدد)
('كيبل كهربائي 3 متر', 'CABLE-3M', NULL, NULL, 50, 'كيبل كهربائي معزول'),
('مفتاح كهربائي', 'SWITCH-001', NULL, NULL, 25, 'مفتاح تشغيل/إيقاف'),
('صمام غاز', 'VALVE-GAS-001', NULL, NULL, 75, 'صمام أمان للغاز')
ON CONFLICT (part_number) DO NOTHING;