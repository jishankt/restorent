import sys
sys.path.append('.')
from app1 import email_tokens_collection

doc = email_tokens_collection.find_one({
    'email': 'manojmanoj88680@gmail.com',
    'token': '924622',
    'type': 'otp'
})
print("Result of find_one:")
print(doc)
