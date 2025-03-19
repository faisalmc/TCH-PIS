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
                      # 1. Configure Firefox for ZAP
                        export MOZ_HEADLESS=1
                        export FIREFOX_BIN="/usr/bin/firefox"

                        # 2. Clean environment setup
                        ZAP_HOME=$(mktemp -d)
                        echo "##[section] Using temporary ZAP home: ${ZAP_HOME}"
                        
                        # 3. Force-clean previous instances
                        echo "##[section] Cleaning previous ZAP instances..."
                        pkill -9 -f "zap.sh" || true
                        sleep 5

                        # 4. Start ZAP with proper logging
                        echo "##[section] Starting ZAP daemon..."
                        /opt/zaproxy/zap.sh -daemon -port 8090 -host 0.0.0.0 \\
                            -dir "${ZAP_HOME}" \\
                            -config api.disablekey=true \\
                            -config database.recoverylog=false \\
                            -config client.firefox.path="${FIREFOX_BIN}" \\
                            -J"-Xmx2048m" > "${ZAP_HOME}/zap.log" 2>&1 &

                        # 5. Wait for startup with proper path handling
                        echo "##[section] Waiting for ZAP initialization..."
                        timeout 120 bash -c '
                            export ZAP_LOG="${ZAP_HOME}/zap.log"
                            attempt=0
                            while ! curl -s http://localhost:8090 >/dev/null; do
                                sleep 5
                                attempt=$((attempt+1))
                                echo "Checking ZAP status (attempt \${attempt})..."
                                
                                # Check if log file exists
                                if [ ! -f "${ZAP_LOG}" ]; then
                                    echo "##[error] ZAP log file missing at ${ZAP_LOG}"
                                    exit 1
                                fi
                                
                                # Check for errors
                                if grep -q "ERROR\|Exception" "${ZAP_LOG}"; then
                                    echo "##[error] Startup errors detected:"
                                    tail -20 "${ZAP_LOG}"
                                    exit 1
                                fi
                            done'

                        # 6. Verify API functionality
                        echo "##[section] Verifying ZAP API..."
                        API_VERSION=$(curl -s http://localhost:8090/JSON/core/view/version)
                        if [ -z "${API_VERSION}" ]; then
                            echo "##[error] ZAP API verification failed"
                            echo "##[debug] Full logs:"
                            cat "${ZAP_HOME}/zap.log"
                            exit 1
                        fi
                        echo "##[section] ZAP API version: ${API_VERSION}"

                        # 7. Import Postman collection
                        echo "##[section] Importing Postman collection..."
                        IMPORT_RESULT=$(curl -s -X POST "http://localhost:8090/JSON/postman/action/importFile/" \\
                            -F "file=@postman-collection.json")
                        
                        if ! echo "${IMPORT_RESULT}" | grep -q '"Result":"OK"'; then
                            echo "##[error] Postman import failed"
                            echo "##[debug] Response: ${IMPORT_RESULT}"
                            exit 1
                        fi

                        # 8. Run security scan
                        echo "##[section] Starting security scan..."
                        /opt/zaproxy/zap.sh -cmd \\
                            -quickurl http://209.38.120.144 \\
                            -quickprogress \\
                            -quickout "${WORKSPACE}/zap-report.html"

                        # 9. Verify report generation
                        if [ ! -f "${WORKSPACE}/zap-report.html" ]; then
                            echo "##[error] Report file missing"
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
