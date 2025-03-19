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
                        // Create directory for ZAP report
            sh 'mkdir -p zap-reports'

            sh '''
        /opt/zaproxy/zap.sh -daemon -host 0.0.0.0 -port 8090 -config api.disablekey=true &
        sleep 30

        # Access target URLs
        curl "http://localhost:8090/JSON/core/action/accessUrl/?url=http://209.38.120.144:3000"
        curl "http://localhost:8090/JSON/core/action/accessUrl/?url=http://209.38.120.144:3001"
        curl "http://localhost:8090/JSON/core/action/accessUrl/?url=http://209.38.120.144:3002"

        # Spider targets first (recommended for active scanning)
        curl "http://localhost:8090/JSON/spider/action/scan/?url=http://209.38.120.144:3000"
        curl "http://localhost:8090/JSON/spider/action/scan/?url=http://209.38.120.144:3001"
        curl "http://localhost:8090/JSON/spider/action/scan/?url=http://209.38.120.144:3002"
        sleep 60  # Wait for spidering

        # Prepare API requests
        echo '{"method":"POST","url":"http://209.38.120.144:3000/auth/register","headers":{"Content-Type":"application/json"},"body":"{\\"username\\": \\"user_5pzl6x\\",\\"password\\": \\"^nOeCQOG2aC!\\",\\"role\\": \\"clerk\\"}"}' > register_request.json
        echo '{"method":"POST","url":"http://209.38.120.144:3000/auth/login","headers":{"Content-Type":"application/json"},"body":"{\\"username\\": \\"testdocteoq21r\\",\\"password\\": \\"testpas21eswqored12\\"}"}' > login_request.json

        # Send requests
        curl -X POST "http://localhost:8090/JSON/core/action/sendRequest/" -H "Content-Type: application/json" --data @register_request.json
        curl -X POST "http://localhost:8090/JSON/core/action/sendRequest/" -H "Content-Type: application/json" --data @login_request.json

        # Start active scans with increased scan policy
curl "http://localhost:8090/JSON/ascan/action/scan/?url=http://209.38.120.144:3000\\&scanPolicyName=Default%20Policy\&recurse=true"
   curl "http://localhost:8090/JSON/ascan/action/scan/?url=http://209.38.120.144:3001\\&scanPolicyName=Default%20Policy\&recurse=true"
        curl "http://localhost:8090/JSON/ascan/action/scan/?url=http://209.38.120.144:3002\\&scanPolicyName=Default%20Policy\&recurse=true"

        # Wait for active scans to complete (adjust time based on application size)
        sleep 90  # 10 minutes for active scanning

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
