import { BlobServiceClient } from '@azure/storage-blob';
import * as dotenv from 'dotenv';

dotenv.config();

async function testAzureConnection() {
  try {
    console.log('🔍 Testing Azure Blob Storage connection...\n');

    // 1. 验证环境变量
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error('❌ AZURE_STORAGE_CONNECTION_STRING not found in .env file');
    }
    console.log('✅ Connection string found');

    // 2. 创建BlobServiceClient
    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    console.log('✅ BlobServiceClient created');

    // 3. 获取容器引用
    const containerName = process.env.AZURE_STORAGE_CONTAINER_BADGES || 'badges';
    const containerClient = blobServiceClient.getContainerClient(containerName);
    console.log(`✅ Container client created for: ${containerName}`);

    // 4. 检查容器是否存在
    const exists = await containerClient.exists();
    console.log(`✅ Container exists: ${exists}`);

    if (!exists) {
      throw new Error(
        `❌ Container '${containerName}' does not exist. Please create it in Azure Portal first.`,
      );
    }

    // 5. 测试上传
    console.log('\n📤 Testing file upload...');
    const testContent = 'Hello from G-Credit Sprint 2!';
    const blobName = `test-${Date.now()}.txt`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.upload(testContent, testContent.length);
    console.log(`✅ Test file uploaded: ${blobName}`);
    console.log(`📍 URL: ${blockBlobClient.url}`);

    // 6. 验证文件可访问
    const downloadResponse = await blockBlobClient.download();
    const downloaded = await streamToString(
      downloadResponse.readableStreamBody!,
    );
    console.log(`✅ Downloaded content: "${downloaded}"`);

    // 7. 清理测试文件
    await blockBlobClient.delete();
    console.log(`✅ Test file deleted`);

    console.log('\n🎉 All tests passed! Azure Blob Storage is ready for Sprint 2.');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('\n📖 Please check sprint-2-azure-setup-guide.md for setup instructions.');
    process.exit(1);
  }
}

async function streamToString(
  readableStream: NodeJS.ReadableStream,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: string[] = [];
    readableStream.on('data', (data) => {
      chunks.push(data.toString());
    });
    readableStream.on('end', () => {
      resolve(chunks.join(''));
    });
    readableStream.on('error', reject);
  });
}

testAzureConnection();
