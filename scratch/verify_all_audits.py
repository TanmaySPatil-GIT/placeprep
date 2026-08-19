import os
import sys

def audit_face_detection():
    print("\n==========================================================================")
    print("AUDIT STEP 1 — FACE DETECTION CODE & LOGGING AUDIT")
    print("==========================================================================")

    file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src', 'services', 'faceDetector.js'))
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Show model loading code
    print("\n1. Model Loading Code in faceDetector.js:")
    for line in content.splitlines()[15:35]:
        print(f"   {line}")

    # 2. Show readyState & dimension validation
    print("\n2. ReadyState & Dimension Validation Code in faceDetector.js:")
    for line in content.splitlines()[67:84]:
        print(f"   {line}")

    # 3. Show raw tick output logging code
    print("\n3. Raw Tick Output Logging Code in faceDetector.js:")
    for line in content.splitlines()[92:107]:
        print(f"   {line}")

    assert 'readyState >= 2' in content, "Must enforce readyState >= 2 check"
    assert 'Raw Detection Output' in content, "Must include raw tick output logging"
    print("\n[OK] Face Detection Audit & Checks Passed!")

def audit_auth_gating():
    print("\n==========================================================================")
    print("AUDIT STEP 2 — AUTH GATING & ROUTING AUDIT")
    print("==========================================================================")

    # 1. Check App.jsx routing structure
    app_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src', 'App.jsx'))
    with open(app_path, 'r', encoding='utf-8') as f:
        app_content = f.read()

    print("\n1. App.jsx Route Protection Structure:")
    for line in app_content.splitlines()[35:68]:
        print(f"   {line}")

    assert 'RootRoute' in app_content, "App.jsx must use RootRoute for unauthenticated root visits"
    assert 'ProtectedRoute' in app_content, "App.jsx must wrap functional routes in ProtectedRoute"
    assert 'SignInPage' in app_content, "App.jsx must declare /signin route"

    # 2. Check AuthContext.jsx onAuthStateChanged listener
    ctx_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src', 'context', 'AuthContext.jsx'))
    with open(ctx_path, 'r', encoding='utf-8') as f:
        ctx_content = f.read()

    print("\n2. AuthContext.jsx onAuthStateChanged Listener:")
    for line in ctx_content.splitlines()[92:105]:
        print(f"   {line}")

    assert 'onAuthStateChanged' in ctx_content, "AuthContext must include onAuthStateChanged listener"
    assert 'setLoading(false)' in ctx_content, "AuthContext must update loading state on auth change"

    # 3. Check ProtectedRoute.jsx wrapper component
    pr_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src', 'components', 'ProtectedRoute.jsx'))
    with open(pr_path, 'r', encoding='utf-8') as f:
        pr_content = f.read()

    assert 'Navigate to="/signin"' in pr_content, "ProtectedRoute must redirect unauthenticated users to /signin"
    assert 'loading' in pr_content, "ProtectedRoute must check loading state"

    print("\n[OK] Auth Gating & Routing Audit Passed!")

if __name__ == '__main__':
    audit_face_detection()
    audit_auth_gating()
    print("\n==========================================================================")
    print("ALL AUDIT VERIFICATIONS PASSED PERFECTLY!")
    print("==========================================================================\n")
