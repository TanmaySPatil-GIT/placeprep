import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import call_gemini, genai_client, MODEL_FALLBACK_CHAIN

def test_rotation_simulation():
    print("\n=================== [SIMULATING MODEL QUOTA EXHAUSTION (429 / 404)] ===================")
    
    # Store original generate_content method
    original_generate = genai_client.models.generate_content

    failed_models = []

    def mock_generate(model, contents, **kwargs):
        # Simulate 429 quota exhaustion on first 3 models
        if model in ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite']:
            failed_models.append((model, "429 RESOURCE_EXHAUSTED"))
            raise Exception("429 RESOURCE_EXHAUSTED: Quota exceeded for model " + model)
        elif model == 'gemini-2.5-flash-lite':
            failed_models.append((model, "404 NOT_FOUND"))
            raise Exception("404 NOT_FOUND: Model " + model + " not found")
        else:
            return original_generate(model=model, contents=contents, **kwargs)

    genai_client.models.generate_content = mock_generate

    try:
        res = call_gemini("Briefly welcome the candidate.")
        print(f"\nFinal Result Output: {res[:100]}...")
    finally:
        # Restore original method
        genai_client.models.generate_content = original_generate

if __name__ == '__main__':
    test_rotation_simulation()
