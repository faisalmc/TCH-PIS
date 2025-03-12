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

        // stage('UNIT_TEST') {
        //     steps {
        //         script {
        //             // Clone the repo inside the running container and install dependencies
        //             sh '''
        //             docker exec tch-pis-container git clone https://github.com/faisalmc/TCH-PIS.git /app/TCH-PIS
        //             docker exec tch-pis-container sh -c "cd /app/TCH-PIS && npm install"
        //             docker exec tch-pis-container sh -c "cd /app/TCH-PIS && npm run test"
        //             '''
        //         }
        //     }
        // }

        // stage('SonarQube Analysis') {
        //     steps {
        //         script {
        //             // Run SonarQube scan using the absolute path to sonar-scanner
        //             sh "/opt/sonar-scanner/bin/sonar-scanner -Dsonar.projectKey=TCH-PIS -Dsonar.projectName=TCH-PIS -Dsonar.projectVersion=1.0 -Dsonar.sources=services -Dsonar.language=js -Dsonar.host.url=http://209.38.120.144:9000 -Dsonar.login=squ_7cfa9c7d2e750c8eed27046bea9b2a8c0009235e"
        //         }
        //     }
        // }


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
                    docker exec tch-pis-container sh -c "cd /app/TCH-PIS && npm run start-all &"
                    '''
                }
            }

        }

        stage('Security Testing with OWASP ZAP') {
            steps {
                script {
                    sh '''
                    # Remove existing ZAP container if it exists
                    if [ "$(docker ps -aq -f name=zap)" ]; then
                        docker stop zap || true
                        docker rm zap || true
                    fi

                   # Pull the latest stable ZAP image
                    docker pull zaproxy/zap-stable

                    # Ensure the report directory exists on the host
                    mkdir -p "$WORKSPACE/zap_reports"

                    # Start OWASP ZAP in headless (daemon) mode with volume mount for reports
                    docker run -d --name zap -p 8088:8088 -v "$WORKSPACE/zap_reports:/zap/wrk" zaproxy/zap-stable zap.sh -daemon -port 8088

                    # Wait for ZAP to be ready
                    echo "Waiting for ZAP to fully start..."
                    timeout=60
                    elapsed=0
                    until curl -s http://localhost:8088 || [ "$elapsed" -ge "$timeout" ]; do
                        echo "Waiting for ZAP... ($elapsed seconds elapsed)"
                        sleep 5
                        elapsed=$((elapsed + 5))
                    done

                    if [ "$elapsed" -ge "$timeout" ]; then
                        echo "❌ ERROR: ZAP did not start within $timeout seconds!"
                        exit 1
                    fi

                    echo "✅ ZAP is running! Proceeding with scan..."

                    # Run ZAP API scan using OpenAPI URL and save the report in the mounted directory
                    docker exec zap zap-api-scan.py -t https://api.jsonbin.io/v3/qs/67d174468561e97a50ea8087 -f openapi -r /zap/wrk/zap_report.html

                    # Print the ZAP report in the Jenkins console
                    echo "====================== OWASP ZAP SECURITY REPORT ======================"
                    cat "$WORKSPACE/zap_reports/zap_report.html" || echo "ZAP Report not found!"
                    echo "======================================================================"
                    '''
                }
            }
        }
    }

    post {
        always {
            script {
                // Cleanup: Stop and remove the container after the pipeline
                sh '''
                docker stop tch-pis-container zap                      
                docker rm tch-pis-container zap
                '''
            }
        }
    }
}
