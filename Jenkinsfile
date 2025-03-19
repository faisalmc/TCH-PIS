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
                    docker run -d --name tch-pis \
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
                    docker exec tch-pis git clone https://github.com/faisalmc/TCH-PIS.git /app/TCH-PIS
                    docker exec tch-pis sh -c "cd /app/TCH-PIS && npm install"
                    docker exec tch-pis sh -c "cd /app/TCH-PIS && npm run test"                    
                    '''
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    // Install/update Node.js to a compatible version
                    sh '''
                    # Print current Node.js version
                    echo "Current Node.js version:"
                    node -v || echo "Node.js not found"
                
                    # Install NVM
                    export NVM_DIR="$HOME/.nvm" || mkdir -p "$HOME/.nvm"
                    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
                
                    # Load NVM and install Node.js 16
                    . "$HOME/.nvm/nvm.sh"
                    nvm install 16
                    nvm use 16
                
                    # Verify Node.js version
                    echo "Updated Node.js version:"
                    node -v
                
                    # Run SonarQube with the updated Node.js version
                    /opt/sonar-scanner/bin/sonar-scanner \
                    -Dsonar.projectKey=TCH-PIS \
                    -Dsonar.projectName=TCH-PIS \
                    -Dsonar.projectVersion=1.0 \
                    -Dsonar.sources=services \
                    -Dsonar.language=js \
                    -Dsonar.host.url=http://209.38.120.144:9000 \
                    -Dsonar.login=squ_7cfa9c7d2e750c8eed27046bea9b2a8c0009235e
                    '''
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
                    docker exec tch-pis sh -c "cd /app/TCH-PIS && nohup npm run start-all > services.log 2>&1 &"
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
                        // Create directory for ZAP report
            sh 'mkdir -p zap-reports'

            sh '''
        /opt/zaproxy/zap.sh -daemon -host 0.0.0.0 -port 8090 -config api.disablekey=true &
        sleep 30

        # Access target URLs
        curl "http://localhost:8090/JSON/core/action/accessUrl/?url=http://209.38.120.144:3000"
        curl "http://localhost:8090/JSON/core/action/accessUrl/?url=http://209.38.120.144:3001"
        curl "http://localhost:8090/JSON/core/action/accessUrl/?url=http://209.38.120.144:3002"




        # Wait for active scans to complete (adjust time based on application size)
        sleep 30

        # Generate report
        curl -s "http://localhost:8090/OTHER/core/other/htmlreport/" > zap-reports/zap-report.html
        curl "http://localhost:8090/JSON/core/action/shutdown/"
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
