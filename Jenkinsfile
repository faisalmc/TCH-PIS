pipeline {
    agent any

    stages {
        stage('Launch Docker Container') {
            steps {
                script {
                    // Run the container in detached mode with port mappings
                    sh '''
                    # Check if the container already exists
                    if [ "$(docker ps -aq -f name=tch-pis-container)" ]; then
                        echo "Stopping and removing existing container..."
                        docker stop tch-pis-container || true
                        docker rm tch-pis-container || true
                    fi

                    # Run the new container in detached mode
                    docker run -d --name tch-pis-container \
                    -p 3000:3000 -p 3001:3001 -p 3002:3002 \
                    tch-pis-image:1.0 tail -f /dev/null
                    '''
                }
            }
        }

        stage('UNIT_TEST') {
            steps {
                script {
                    // Clone the repo inside the running container and install dependencies
                    sh '''
                    docker exec tch-pis-container git clone https://github.com/faisalmc/TCH-PIS.git /app/TCH-PIS
                    docker exec tch-pis-container sh -c "cd /app/TCH-PIS && npm install"
                    docker exec tch-pis-container sh -c "cd /app/TCH-PIS && npm run test"                    
                    '''
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    // Run SonarQube scan using the absolute path to sonar-scanner
                    sh "/opt/sonar-scanner/bin/sonar-scanner -Dsonar.projectKey=TCH-PIS -Dsonar.projectName=TCH-PIS -Dsonar.projectVersion=1.0 -Dsonar.sources=services -Dsonar.language=js -Dsonar.host.url=http://209.38.120.144:9000 -Dsonar.login=squ_7cfa9c7d2e750c8eed27046bea9b2a8c0009235e"
                }
            }
        }


        stage('BUILD') {
            when {
                expression {
                    // Run BUILD stage only if UNIT_TEST is successful
                    currentBuild.result == null || currentBuild.result == 'SUCCESS'
                }
            }
            steps {
                script {
                    // Run start-all command inside the container
                    sh '''
                    docker exec tch-pis-container sh -c "cd /app/TCH-PIS && nohup npm run start-all > services.log 2>&1 &"
                    '''
                }
            }

        }

   stage('Postman Tests') {
            steps {
                script {
                   
                    
                    // Log in to Postman CLI using the stored API key
                    // The credentials() step will inject the secret into the environment variable POSTMAN_API_KEY
                    withCredentials([string(credentialsId: 'POSTMAN_API_KEY', variable: 'POSTMAN_API_KEY')]) {
                       // Log in to Postman CLI using the API key from credentials
                        sh 'postman login --with-api-key $POSTMAN_API_KEY'
                        
                        // Run the Postman collection (update collection ID as needed)
                        sh 'postman collection run "41554359-536005ad-d0e6-44a4-b618-6b6730ffa88c"'
                    }
                }
            }
        }

        stage('Security Testing with OWASP ZAP') {
            steps {
        script {
             // Create directory for reports
            sh 'mkdir -p security-reports'
            
            // Test the APIs using curl and save results
            sh '''
            # Test endpoint 1
            echo "Testing API: http://209.38.120.144:3000/auth/register" >> security-reports/test-results.txt
            curl -s -o security-reports/api1-response.json -w "Status: %{http_code}\\n" \
              --location 'http://209.38.120.144:3000/auth/register' \
              --header 'Content-Type: application/json' \
              --data '{"username": "test_user1", "password": "Test123!", "role": "clerk"}' \
              >> security-reports/test-results.txt
            echo "--------------------" >> security-reports/test-results.txt
            
            # Test endpoint 2
            echo "Testing API: http://209.38.120.144:3001" >> security-reports/test-results.txt
            curl -s -o security-reports/api2-response.json -w "Status: %{http_code}\\n" \
              --location 'http://209.38.120.144:3001' \
              >> security-reports/test-results.txt
            echo "--------------------" >> security-reports/test-results.txt
            
            # Test endpoint 3
            echo "Testing API: http://209.38.120.144:3002" >> security-reports/test-results.txt
            curl -s -o security-reports/api3-response.json -w "Status: %{http_code}\\n" \
              --location 'http://209.38.120.144:3002' \
              >> security-reports/test-results.txt
            
            # Create HTML report
            echo "<html>
            <head>
                <title>API Security Test Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #2c3e50; }
                    .endpoint { background-color: #f8f9fa; padding: 10px; margin: 10px 0; border-radius: 5px; }
                    .status-200 { color: green; }
                    .status-error { color: red; }
                </style>
            </head>
            <body>
                <h1>API Security Test Report</h1>
                <p>Generated on: $(date)</p>
                
                <h2>Endpoints Tested:</h2>
                <div class='endpoint'>
                    <h3>1. http://209.38.120.144:3000/auth/register</h3>
                    <p>Status: $(grep 'Status:' security-reports/test-results.txt | head -1 | cut -d' ' -f2)</p>
                </div>
                
                <div class='endpoint'>
                    <h3>2. http://209.38.120.144:3001</h3>
                    <p>Status: $(grep 'Status:' security-reports/test-results.txt | head -2 | tail -1 | cut -d' ' -f2)</p>
                </div>
                
                <div class='endpoint'>
                    <h3>3. http://209.38.120.144:3002</h3>
                    <p>Status: $(grep 'Status:' security-reports/test-results.txt | head -3 | tail -1 | cut -d' ' -f2)</p>
                </div>
                
                <h2>Security Recommendations:</h2>
                <ul>
                    <li>Ensure proper input validation on all endpoints</li>
                    <li>Implement rate limiting to prevent brute force attacks</li>
                    <li>Use HTTPS instead of HTTP for all API communications</li>
                    <li>Implement proper authentication and authorization</li>
                    <li>Regularly update dependencies to prevent vulnerabilities</li>
                </ul>
            </body>
            </html>" > security-reports/api-security-report.html
            '''
        }
    }
        }
    }

    post {
        always {
            script {
                  // Archive the security reports
            archiveArtifacts artifacts: "security-reports/**/*", allowEmptyArchive: true
                
                sh '''
                docker stop tch-pis-container                 
                docker rm tch-pis-container
                '''
            }
        }
    }
}
