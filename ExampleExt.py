from TDStoreTools import StorageManager
import TDFunctions as TDF
import json
import base64
import numpy as np
import cv2 as cv
import time

class ExampleExt:
	"""
	DefaultExt description
	"""
	def __init__(self, ownerComp):
		# The component to which this extension is attached
		self.ownerComp = ownerComp

		# properties
		TDF.createProperty(self, 'MyProperty', value=0, dependable=True,
						   readOnly=False)

		# attributes:
		self.a = 0 # attribute
		self.B = 1 # promoted attribute

		# stored items (persistent across saves and re-initialization):
		storedItems = [
			# Only 'name' is required...
			{'name': 'Step', 'default': 0},
			{'name': 'Gender', 'default': None},
			{'name': 'Location', 'default': None},
			{'name': 'ShowFrame', 'default': 0},
			{'name': 'Image_base64', 'default': None},		
			{'name': 'Qr_code_base64', 'default': None},
		]	
		# Uncomment the line below to store StoredProperty. To clear stored
		# 	items, use the Storage section of the Component Editor
		
		self.stored = StorageManager(self, ownerComp, storedItems)

	def myFunction(self, v):
		debug(v)

	def PromotedFunction(self, v):
		debug(v)

	def getStep(self, eventData):
		print(eventData)
		"""
		Извлекает значение step из объекта события
		
		Args:
			eventData (dict|str): Объект события с полем payload (dict или JSON строка)
			
		Returns:
			str|None: Значение step из payload, или None если отсутствует
		"""
		# Если данные пришли как строка, парсим JSON
		if isinstance(eventData, str):
			try:
				eventData = json.loads(eventData)
			except (json.JSONDecodeError, ValueError):
				return None
		
		# Теперь работаем с dict
		if eventData and isinstance(eventData, dict):
			payload = eventData.get('payload')
			if payload and isinstance(payload, dict):
				return payload.get('step')

		return None
	
	def getGender(self, eventData):
		"""
		Извлекает значение gender из объекта события
		
		Args:
			eventData (dict|str): Объект события с полем payload (dict или JSON строка)
			
		Returns:
			str|None: Значение gender из payload, или None если отсутствует
		"""
		# Если данные пришли как строка, парсим JSON
		if isinstance(eventData, str):
			try:
				eventData = json.loads(eventData)
			except (json.JSONDecodeError, ValueError):
				return None
		
		# Теперь работаем с dict
		if eventData and isinstance(eventData, dict):
			payload = eventData.get('payload')
			if payload and isinstance(payload, dict):
				return payload.get('gender')

		return None
	
	def getLocation(self, eventData):
		"""
		Извлекает значение locationId из объекта события
		
		Args:
			eventData (dict|str): Объект события с полем payload (dict или JSON строка)
			
		Returns:
			int|None: Значение locationId из payload, или None если отсутствует
		"""
		# Если данные пришли как строка, парсим JSON
		if isinstance(eventData, str):
			try:
				eventData = json.loads(eventData)
			except (json.JSONDecodeError, ValueError):
				return None
		
		# Теперь работаем с dict
		if eventData and isinstance(eventData, dict):
			payload = eventData.get('payload')
			if payload and isinstance(payload, dict):
				return payload.get('locationId')

		return None
	
	def setLocation(self, location):
		for row in op('base3/table1').rows():
			row[0].val = 0.3

		op('base3/table1')[location,0] = 1

	def imagetobytes(self, img):
		"""
		Преобразует изображение из TouchDesigner оператора в base64 строку (JPEG формат)
		
		Args:
			img: TouchDesigner оператор (TOP) с изображением
			
		Returns:
			str: Base64 строка изображения в формате JPEG
		"""
		image = img.numpyArray(delayed=False)*255
		image = np.flipud(image).astype(np.uint8)
		# Check if the image has an alpha channel
		if image.shape[2] == 4:
			# Убираем альфа-канал и конвертируем в RGB для JPEG
			image = cv.cvtColor(image, cv.COLOR_BGRA2RGB)
		else:
			image = cv.cvtColor(image, cv.COLOR_BGR2RGB)
		# Кодируем в JPEG формат
		imageData = cv.imencode('.jpg', image)[1].tobytes()
		init_image = str(base64.b64encode(imageData), "utf-8")
		return init_image

	def bytestoimage(self, outputOp, base64_string):
		"""
		Преобразует base64 строку в изображение и сохраняет в TouchDesigner оператор
		
		Args:
			outputOp: TouchDesigner оператор (TOP) для сохранения изображения
			base64_string: Base64 строка изображения
		"""
		try:
			# Декодируем base64 в байты
			image_bytes = base64.b64decode(base64_string)
			# Декодируем изображение из байтов
			img = cv.imdecode(np.frombuffer(image_bytes, np.uint8), -1)
			
			# Проверяем, что изображение успешно декодировано
			if img is None:
				debug("Error: Failed to decode image from base64")
				return
			
			# Проверяем количество измерений
			if len(img.shape) < 2:
				debug("Error: Invalid image shape")
				return
			
			# Обрабатываем градации серого (2D массив)
			if len(img.shape) == 2:
				# Конвертируем в RGB (3 канала)
				img = cv.cvtColor(img, cv.COLOR_GRAY2RGB)
			
			# Конвертируем цветовое пространство
			if len(img.shape) == 3:
				if img.shape[2] == 4:
					img = cv.cvtColor(img, cv.COLOR_RGBA2BGRA)
				elif img.shape[2] == 3:
					img = cv.cvtColor(img, cv.COLOR_RGB2BGR)
			
			# Переворачиваем по вертикали (TouchDesigner использует инвертированную Y-ось)
			img = cv.flip(img, 0)
			# Нормализуем значения от 0 до 1
			img = img.astype(np.float32) / 255.0
			# Копируем в оператор TouchDesigner
			outputOp.copyNumpyArray(img)
		except Exception as e:
			debug(f"Error decoding base64 image: {e}")

	def step(self, eventData):
		step = self.getStep(eventData)
		gender = self.getGender(eventData)
		location = self.getLocation(eventData)

		if step == 'rules':
			self.stored['Step'] = 1
			self.stored['Gender'] = 0
			self.setLocation(0)

		elif step == 'gender':
			self.stored['Step'] = 2
		elif step == 'location':
			self.stored['Step'] = 3
		elif step == 'capture':
			self.stored['Step'] = 4
			self.stored['ShowFrame'] = 1
		elif step == 'capture-make-photo':
			op('base4').par.Start.pulse()
		elif step == 'capture_done':
			self.stored['ShowFrame'] = 0
		elif step == 'loading':
			op('base5').par.Start.pulse()
			self.generate_image()
			self.stored['Step'] = 5
		elif step == 'done':
			self.stored['Step'] = 6
			self.send_image_to_frontend()
		elif step == 'create-qr-and-print':
			self.create_qr_code()
			self.print()
		elif step == 'qr':
			self.create_qr_code()
		elif step == 'intro':
			self.reset()

		# Сохраняем gender если он есть
		if gender is not None:
			if gender == 'male':
				self.stored['Gender'] = 1
			elif gender == 'female':
				self.stored['Gender'] = 2

		# Сохраняем locationId если он есть
		if location is not None:
			self.stored['Location'] = location
			self.setLocation(location)

	def generate_image(self):
		self.stored['Image_base64'] = None
		url = "http://195.209.210.78:8000/process_image"
		face = self.imagetobytes(op('base4/null3'))
		
		# Преобразуем gender в строку
		gender_value = self.stored['Gender']
		if gender_value == 1:
			gender_str = "male"
		elif gender_value == 2:
			gender_str = "female"
		else:
			gender_str = ""
		
		# Преобразуем location в строку
		location_value = self.stored['Location']
		location_str = str(location_value) if location_value is not None else ""
		
		payload = {
			"image_base64": face,
			"gender": gender_str,
			"location": location_str
		}
		payload_json = json.dumps(payload)

		op('webclient1').request(url, "POST", data=payload_json, header={'Content-Type': 'application/json'})

		return face

	def update_image_base64(self, data):
		"""
		Извлекает image_base64 из JSON и сохраняет в stored
		
		Args:
			data (dict|str|bytes): JSON объект, JSON строка или bytes с полем image_base64
		"""
		try:
			# Если данные пришли как bytes, декодируем в строку
			if isinstance(data, bytes):
				data = data.decode('utf-8')
			
			# Если данные пришли как строка, парсим JSON
			if isinstance(data, str):
				data = json.loads(data)
			
			# Извлекаем image_base64 из JSON
			if isinstance(data, dict):
				image_base64 = data.get('image_base64')
				if image_base64:
					return image_base64
				else:
					debug("No image_base64 field in JSON")
			else:
				debug(f"Invalid data type: {type(data)}")
		except json.JSONDecodeError as e:
			debug(f"Error parsing JSON: {e}")
		except Exception as e:
			debug(f"Error updating image_base64: {e}")
	
	def create_qr_code(self):
		url = "http://195.209.210.78:8000/upload_base64"
		payload = {
			"image_base64": self.stored['Image_base64'],
			"quality": 95
		}
		payload_json = json.dumps(payload)
		op('webclient2').request(url, "POST", data=payload_json, header={'Content-Type': 'application/json'})
	
	def show_qr(self):
		self.stored['Step'] = 7

	def print(self):
		filepath = f"output/{int(time.time())}.jpeg"
		op('base6/null1').save(filepath, asynchronous=False, createFolders=True, quality=1.0)
		pass
	
	def send_image_to_frontend(self):
		try:
			message = json.dumps({"image_base64": self.stored['Image_base64']})
			op('websocket1').sendText(message)
		except Exception as e:
			debug(f"Error sending image via websocket: {e}")

	def reset(self):
		self.stored['Step'] = 0
		self.stored['Gender'] = 0
		self.stored['Location'] = None
		self.stored['ShowFrame'] = 0
		self.setLocation(0)
		self.stored['Image_base64'] = None
		self.stored['Qr_code_base64'] = None