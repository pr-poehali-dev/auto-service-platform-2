ALTER TABLE articles ADD COLUMN IF NOT EXISTS car_brands TEXT DEFAULT '';

UPDATE articles SET car_brands = 'universal' WHERE car_brands IS NULL OR car_brands = '';

-- Тормоза Brembo — универсал + спорт
UPDATE articles SET car_brands = 'bmw,audi,mercedes,volkswagen,universal' WHERE brand = 'Brembo';
UPDATE articles SET car_brands = 'bmw,audi,mercedes,toyota,honda,universal' WHERE brand = 'TRW';
UPDATE articles SET car_brands = 'universal' WHERE brand = 'Castrol';
UPDATE articles SET car_brands = 'universal' WHERE brand = 'Mobil1';
UPDATE articles SET car_brands = 'universal' WHERE brand = 'FELIX';
UPDATE articles SET car_brands = 'universal' WHERE brand = 'Turtle Wax';

-- Фильтры Mann
UPDATE articles SET car_brands = 'volkswagen,audi,bmw,mercedes,toyota,honda,hyundai,kia,universal' WHERE brand = 'Mann';

-- Амортизаторы
UPDATE articles SET car_brands = 'toyota,honda,hyundai,kia,lada,universal' WHERE brand = 'KYB';
UPDATE articles SET car_brands = 'bmw,mercedes,audi,volkswagen,universal' WHERE brand = 'Lemforder';
UPDATE articles SET car_brands = 'universal' WHERE brand = 'Febi';

-- Подшипники SKF
UPDATE articles SET car_brands = 'universal' WHERE brand = 'SKF';
UPDATE articles SET car_brands = 'universal' WHERE brand = 'FAG';

-- Ремни
UPDATE articles SET car_brands = 'toyota,honda,hyundai,kia,volkswagen,audi,universal' WHERE brand = 'Gates';
UPDATE articles SET car_brands = 'universal' WHERE brand = 'Continental';
UPDATE articles SET car_brands = 'volkswagen,audi,bmw,universal' WHERE brand = 'INA';

-- Двигатель
UPDATE articles SET car_brands = 'bmw,mercedes,audi,volkswagen,universal' WHERE brand = 'Elring';
UPDATE articles SET car_brands = 'toyota,honda,hyundai,kia,universal' WHERE brand = 'Wahler';

-- Свечи NGK
UPDATE articles SET car_brands = 'toyota,honda,hyundai,kia,lada,universal' WHERE brand = 'NGK';
UPDATE articles SET car_brands = 'volkswagen,audi,bmw,mercedes,universal' WHERE brand = 'Bosch';

-- Сцепление LuK
UPDATE articles SET car_brands = 'volkswagen,audi,bmw,mercedes,lada,universal' WHERE brand = 'LuK';
UPDATE articles SET car_brands = 'universal' WHERE brand = 'GKN';

-- Выхлоп Bosal
UPDATE articles SET car_brands = 'universal' WHERE brand = 'Bosal';

-- Электрика Varta, Hella, Osram, Philips
UPDATE articles SET car_brands = 'universal' WHERE brand = 'Varta';
UPDATE articles SET car_brands = 'universal' WHERE brand = 'Hella';
UPDATE articles SET car_brands = 'universal' WHERE brand = 'Osram';
UPDATE articles SET car_brands = 'universal' WHERE brand = 'Philips';

-- Охлаждение Nissens
UPDATE articles SET car_brands = 'toyota,honda,bmw,mercedes,audi,volkswagen,universal' WHERE brand = 'Nissens';

-- Тюнинг
UPDATE articles SET car_brands = 'bmw,audi,mercedes,volkswagen,honda,toyota,universal' WHERE brand = 'Eibach';
UPDATE articles SET car_brands = 'bmw,audi,mercedes,volkswagen,universal' WHERE brand = 'BC Racing';
UPDATE articles SET car_brands = 'bmw,audi,mercedes,honda,toyota,universal' WHERE brand = 'AP Racing';
UPDATE articles SET car_brands = 'universal' WHERE brand = 'Motul';

-- Stabilus
UPDATE articles SET car_brands = 'volkswagen,audi,bmw,universal' WHERE brand = 'Stabilus';

-- Lada-специфичные: выставляем вручную для нескольких позиций
UPDATE articles SET car_brands = 'lada,hyundai,kia,toyota,universal' WHERE brand = 'Original'