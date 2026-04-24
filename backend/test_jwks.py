from jwt import PyJWKClient

url = "https://bursting-halibut-38.clerk.accounts.dev/.well-known/jwks.json"

try:
    print("Testing PyJWKClient...")
    client = PyJWKClient(url)
    keys = client.get_jwk_set()
    print("Success! Keys:", keys)
except Exception as e:
    print(f"Failed: {e}")
