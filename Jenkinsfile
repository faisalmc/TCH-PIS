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
                      sh '''
                # 0. Verify Pre-requisites
                if [ ! -f postman-collection.json ]; then
                    echo "❌ Missing postman-collection.json file"
                    exit 1
                fi

                # 1. Start ZAP with error trapping
                echo "Starting ZAP with required add-ons..."
                if ! /opt/zaproxy/zap.sh -daemon -port 8090 -config api.disablekey=true \\
                    -addoninstall importexport \\
                    -addoninstall postman \\
                    -addonupdate & then
                    echo "❌ Failed to start ZAP"
                    exit 1
                fi

                # Wait for ZAP initialization with timeout
                timeout 30 bash -c 'while ! curl -s http://localhost:8090 >/dev/null; do sleep 2; done' || {
                    echo "❌ ZAP failed to start within 30 seconds"
                    exit 1
                }

                # 2. Import Postman collection with verification
                echo "Importing Postman collection..."
                IMPORT_RESULT=$(curl -s -X POST "http://localhost:8090/JSON/postman/action/importCollection/" \\
                     -F "file=@postman-collection.json" \\
                     -F "url=http://209.38.120.144")

                if ! echo "$IMPORT_RESULT" | grep -q '"Result":"OK"'; then
                    echo "❌ Collection import failed. Response: $IMPORT_RESULT"
                    exit 1
                fi

                # 3. Verify URLs in sites tree
                echo "Verifying imported URLs..."
                SITES_LIST=$(curl -s "http://localhost:8090/JSON/core/view/sites/")
                if ! echo "$SITES_LIST" | grep -q "209.38.120.144"; then
                    echo "❌ Target URL not found in ZAP sites"
                    echo "Debug - Sites list: $SITES_LIST"
                    exit 1
                fi

                # 4. Run scan with progress monitoring
                echo "Starting security scan..."
                SCAN_STATUS=$(/opt/zaproxy/zap.sh -cmd \\
                    -quickurl http://209.38.120.144 \\
                    -quickprogress \\
                    -quickout zap-report.html 2>&1)

                if [ $? -ne 0 ]; then
                    echo "❌ Scan failed. Output: $SCAN_STATUS"
                    exit 1
                fi

                # 5. Verify report generation
                if [ ! -f zap-report.html ]; then
                    echo "❌ Report file not generated"
                    exit 1
                fi

                echo "✅ Scan completed successfully"
            '''

        }
    }
        }
    }

    post {
        always {
            script {
                  // Archive the security reports
            archiveArtifacts artifacts: "zap-reports/*", allowEmptyArchive: true
             sh '''
                # Force cleanup if still running
                pkill -f "zap.sh" || true
            '''
                
                sh '''
                docker stop tch-pis-container                 
                docker rm tch-pis-container
                '''
            }
        }
    }
}
