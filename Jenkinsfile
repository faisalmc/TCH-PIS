pipeline {
    agent any

    stages {
        stage('Launch Docker Container') {
            steps {
                script {
                    // Run the container in detached mode with port mappings
                    sh '''
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
                    docker exec tch-pis-container sh -c "cd /app/TCH-PIS && npm run start-all &"
                    '''
                }
            }

        }

        stage('Security Testing with OWASP ZAP') {
            steps {
                script {
                   sh '''
                    # Start OWASP ZAP in daemon mode
                    docker pull zaproxy/zap-stable
                    docker run -d --name zap -p 8088:8088 zaproxy/zap-stable zap.sh -daemon -port 8088
                    
                    # Wait for ZAP to start
                    sleep 10

                    # Scan API on port 3000
                    docker exec zap zap-cli quick-scan --self-contained --start-options '-config api.disablekey=true' http://tch-pis-container:3000
                    docker exec zap zap-cli active-scan http://tch-pis-container:3000

                    # Scan API on port 3001
                    docker exec zap zap-cli quick-scan --self-contained --start-options '-config api.disablekey=true' http://tch-pis-container:3001
                    docker exec zap zap-cli active-scan http://tch-pis-container:3001

                    # Scan API on port 3002
                    docker exec zap zap-cli quick-scan --self-contained --start-options '-config api.disablekey=true' http://tch-pis-container:3002
                    docker exec zap zap-cli active-scan http://tch-pis-container:3002

                    # Generate combined ZAP report
                    docker exec zap zap-cli report -o /zap/wrk/zap_report.html -f html
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
                docker stop tch-pis-container
                docker rm tch-pis-container
                '''
            }
        }
    }
}
