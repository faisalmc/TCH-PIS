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
                # 0. Create unique workspace directory
                ZAP_DIR=$(mktemp -d)
                echo "Using ZAP home directory: ${ZAP_DIR}"

                # 1. Install latest Postman add-on explicitly
                /opt/zaproxy/zap.sh -cmd \
                    -addoninstall postman \
                    -addonupdate -nostart

                # 2. Start ZAP with unique directory and increased memory
                /opt/zaproxy/zap.sh -daemon -port 8090 \
                    -config api.disablekey=true \
                    -dir "${ZAP_DIR}" \
                    -config database.recoverylog=false \
                    -J"-Xmx2048m" &

                # 3. Wait for ZAP initialization with verification
                echo "Waiting for ZAP to start..."
                curl --retry 10 --retry-delay 5 --max-time 3 http://localhost:8090 || {
                    echo "❌ ZAP failed to start"
                    exit 1
                }

                # 4. Import collection using correct format
                echo "Importing Postman collection..."
                IMPORT_RESULT=$(curl -s -X POST "http://localhost:8090/JSON/postman/action/importFile/" \
                    -F "file=@postman-collection.json")

                if ! echo "${IMPORT_RESULT}" | grep -q '"Result":"OK"'; then
                    echo "❌ Collection import failed. Response: ${IMPORT_RESULT}"
                    exit 1
                fi

                # 5. Run scan with unique output file
                echo "Starting security scan..."
                /opt/zaproxy/zap.sh -cmd \
                    -quickurl http://209.38.120.144 \
                    -quickprogress \
                    -quickout "${WORKSPACE}/zap-report.html"

                # 6. Verify report generation
                if [ ! -f "${WORKSPACE}/zap-report.html" ]; then
                    echo "❌ Report file not generated"
                    exit 1
                fi
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
