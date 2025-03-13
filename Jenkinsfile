pipeline {
    agent any

    stages {

        stage('Setup Docker Network') {
            steps {
                script {
                    sh '''
                    # Create Docker network if it doesn’t exist
                    if [ -z "$(docker network ls | grep zapnet)" ]; then
                        docker network create zapnet
                    fi
                    '''
                }
            }
        }



        stage('Launch Docker Container') {
            steps {
                script {
                    sh '''
                    # Remove existing container if it exists
                    if [ "$(docker ps -aq -f name=tch-pis-container)" ]; then
                        docker stop tch-pis-container || true
                        docker rm tch-pis-container || true
                    fi

                    # Start the API container on zapnet
                    docker run -d --name tch-pis-container --net zapnet \
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

                    # Ensure report directory exists in Jenkins workspace
                    mkdir -p $WORKSPACE/zap_reports

                    # Start OWASP ZAP in headless mode with volume mount for reports
                    docker run -d --name zap --net zapnet -p 8088:8088 \
                    -v $WORKSPACE/zap_reports:/zap/wrk zaproxy/zap-stable zap.sh -daemon -port 8088

                    # Wait for ZAP to initialize
                    sleep 10

                    # Run ZAP API scan directly from the OpenAPI URL and save the report
                    docker exec zap zap-api-scan.py -t https://api.jsonbin.io/v3/qs/67d174468561e97a50ea8087 -f openapi -r /zap/wrk/zap_report.html
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
