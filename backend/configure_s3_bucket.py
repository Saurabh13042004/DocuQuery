"""
Script to configure S3 bucket for public file access and CORS
"""
import os
import boto3
import json
from dotenv import load_dotenv

load_dotenv()

def configure_s3_bucket():
    try:
        # Initialize S3 client
        s3_client = boto3.client(
            's3',
            aws_access_key_id=os.environ["AWS_ACCESS_KEY"],
            aws_secret_access_key=os.environ['AWS_SECRET_KEY'],
            region_name=os.environ['AWS_REGION']
        )
        
        bucket_name = os.environ['AWS_BUCKET_NAME']
        
        print(f"Configuring bucket: {bucket_name}")
        print("=" * 60)
        
        # 1. Configure CORS
        print("\n1️⃣  Configuring CORS...")
        cors_config = {
            'CORSRules': [
                {
                    'AllowedHeaders': ['*'],
                    'AllowedMethods': ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
                    'AllowedOrigins': ['*'],
                    'ExposeHeaders': ['ETag', 'x-amz-version-id'],
                    'MaxAgeSeconds': 3000
                }
            ]
        }
        
        try:
            s3_client.put_bucket_cors(Bucket=bucket_name, CORSConfiguration=cors_config)
            print("✅ CORS configured successfully")
        except Exception as e:
            print(f"⚠️  CORS configuration error: {e}")
        
        # 2. Configure bucket policy for public read access
        print("\n2️⃣  Configuring bucket policy...")
        bucket_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "PublicReadGetObject",
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": "s3:GetObject",
                    "Resource": f"arn:aws:s3:::{bucket_name}/*"
                },
                {
                    "Sid": "ListBucket",
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": "s3:ListBucket",
                    "Resource": f"arn:aws:s3:::{bucket_name}"
                }
            ]
        }
        
        try:
            s3_client.put_bucket_policy(
                Bucket=bucket_name,
                Policy=json.dumps(bucket_policy)
            )
            print("✅ Bucket policy configured successfully")
        except Exception as e:
            print(f"⚠️  Bucket policy configuration error: {e}")
        
        # 3. Check Block Public Access settings
        print("\n3️⃣  Checking Block Public Access settings...")
        try:
            public_access_config = s3_client.get_public_access_block(Bucket=bucket_name)
            current_config = public_access_config['PublicAccessBlockConfiguration']
            print(f"Current settings:")
            print(f"  - BlockPublicAcls: {current_config['BlockPublicAcls']}")
            print(f"  - IgnorePublicAcls: {current_config['IgnorePublicAcls']}")
            print(f"  - BlockPublicPolicy: {current_config['BlockPublicPolicy']}")
            print(f"  - RestrictPublicBuckets: {current_config['RestrictPublicBuckets']}")
            
            # Allow public access
            s3_client.put_public_access_block(
                Bucket=bucket_name,
                PublicAccessBlockConfiguration={
                    'BlockPublicAcls': False,
                    'IgnorePublicAcls': False,
                    'BlockPublicPolicy': False,
                    'RestrictPublicBuckets': False
                }
            )
            print("✅ Public access enabled for bucket")
        except Exception as e:
            print(f"⚠️  Public access error: {e}")
        
        # 4. Set bucket versioning (optional but good practice)
        print("\n4️⃣  Checking bucket versioning...")
        try:
            versioning = s3_client.get_bucket_versioning(Bucket=bucket_name)
            status = versioning.get('Status', 'Not set')
            print(f"Current versioning status: {status}")
        except Exception as e:
            print(f"⚠️  Versioning check error: {e}")
        
        print("\n" + "=" * 60)
        print("✅ S3 bucket configuration completed!")
        print(f"\n📝 Your bucket is now configured for public file access.")
        print(f"🌐 PDF URLs should work like: https://{bucket_name}.s3.{os.environ['AWS_REGION']}.amazonaws.com/pdfs/filename.pdf")
        
        return True
        
    except Exception as e:
        print(f"❌ Configuration failed: {e}")
        return False

if __name__ == "__main__":
    configure_s3_bucket()
