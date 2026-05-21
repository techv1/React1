import hashlib

def get_sha1(s):
    return hashlib.sha1(s.encode()).hexdigest()

video_id = "93745616"
license_code = "814570226874096" # Try without $
license_code_with_dollor = "$814570226874096"
server_id = "8512"
postfix_480 = "_480m.mp4"
postfix_720 = "_720m.mp4"

target_480 = "b27addedeb075ba9ee524f53be615bc6514e5ea44c"
target_720 = "2502eb538e87bf4f35a146506b0ff0f34de65e9fe4"

tests = [
    video_id + license_code + server_id,
    video_id + license_code_with_dollor + server_id,
    license_code + video_id + server_id,
    video_id + server_id + license_code,
    video_id + postfix_480 + license_code,
    video_id + license_code + postfix_480,
    server_id + video_id + license_code,
    video_id + server_id,
    video_id + license_code,
]

print("Target 480:", target_480)
for t in tests:
    res = get_sha1(t)
    if res == target_480:
        print(f"MATCH FOUND for 480: {t}")
    else:
        # print(f"No match for {t}: {res}")
        pass

# Try adding some common KVS salts
kvs_salts = ["", "kvs", "kt", "omg"]
for salt in kvs_salts:
    if get_sha1(video_id + salt + license_code) == target_480:
        print(f"MATCH: {video_id} + {salt} + {license_code}")

print("Done testing.")
